/**
 * appointments.repository.js
 *
 * Capa de acceso a datos del módulo de turnos/tratamientos.
 * Responsabilidad única: hablar con Prisma. Acá NO hay reglas de negocio:
 * ni validación de input, ni límites de fotos, ni la regla "antes/después",
 * ni manejo de archivos. Recibe datos ya normalizados y devuelve filas.
 *
 * Única excepción deliberada: updateAppointmentWithPhotos recibe el
 * callback `computeLegacyFileIds` (inversión de dependencias) porque el
 * cálculo de los file IDs legacy es negocio, pero DEBE ejecutarse dentro
 * de la misma transacción que persiste las fotos. El repo es dueño de la
 * transacción; el servicio es dueño de la regla.
 */

import prisma from "../../config/prisma.js";

export const APPOINTMENT_LIST_SELECT = {
  id: true,
  date: true,
  time: true,
  treatment: true,
  amount: true,
  notes: true,
  status: true,
  method: true,
  createdAt: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      address: true,
    },
  },
};

const APPOINTMENT_PHOTO_SELECT = {
  id: true,
  fileId: true,
  label: true,
  position: true,
  createdAt: true,
};

const APPOINTMENT_PHOTO_ORDER = [{ position: "asc" }, { createdAt: "asc" }];

// --- Pacientes ---

/**
 * Devuelve { id } si el paciente existe y pertenece al usuario; null si no.
 * La validación del formato de patientId y el error 404 son del servicio.
 */
export function findOwnedPatient(userId, patientId) {
  return prisma.patient.findFirst({
    where: {
      id: patientId,
      userId,
    },
    select: { id: true },
  });
}

// --- Turnos: lectura ---

export function findOwnedAppointment(id, userId) {
  return prisma.appointment.findFirst({
    where: {
      id: Number(id),
      userId,
    },
    select: {
      id: true,
      userId: true,
      patientId: true,
      date: true,
      time: true,
      treatment: true,
      amount: true,
      notes: true,
      status: true,
      method: true,
      createdAt: true,
      beforePhotoFileId: true,
      afterPhotoFileId: true,
      photos: {
        select: APPOINTMENT_PHOTO_SELECT,
        orderBy: APPOINTMENT_PHOTO_ORDER,
      },
    },
  });
}

export function findManyByUser(userId, { offset = 0, limit = 50 } = {}) {
  return prisma.appointment.findMany({
    where: { userId },
    select: APPOINTMENT_LIST_SELECT,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: offset,
    take: limit,
  });
}

export function findManyByPatient(
  userId,
  patientId,
  { offset = 0, limit = 50 } = {}
) {
  return prisma.appointment.findMany({
    where: {
      userId,
      patientId: Number(patientId),
    },
    select: APPOINTMENT_LIST_SELECT,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: offset,
    take: limit,
  });
}

export function findByIdForList(id) {
  return prisma.appointment.findUnique({
    where: { id },
    select: APPOINTMENT_LIST_SELECT,
  });
}

export function countCompleted(userId) {
  return prisma.appointment.count({
    where: {
      userId,
      OR: [{ completed: true }, { status: "Pagado" }, { status: "pagado" }],
    },
  });
}

// --- Turnos: escritura ---

/**
 * Crea el turno con datos ya normalizados por el servicio.
 * Devuelve solo { id }: el registro completo se lee después con
 * setLegacyPhotoFileIds / findByIdForList.
 */
export function createAppointment(data) {
  return prisma.appointment.create({
    data,
    select: { id: true },
  });
}

/**
 * Actualiza los punteros legacy before/after y devuelve el turno
 * con el select de listado (respuesta final de create).
 */
export function setLegacyPhotoFileIds(
  appointmentId,
  { beforePhotoFileId, afterPhotoFileId }
) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      beforePhotoFileId,
      afterPhotoFileId,
    },
    select: APPOINTMENT_LIST_SELECT,
  });
}

/**
 * Borra el turno verificando pertenencia (deleteMany para no tirar
 * si otro proceso lo borró antes). Devuelve { count }.
 */
export function deleteOwnedAppointment(id, userId) {
  return prisma.appointment.deleteMany({
    where: {
      id: Number(id),
      userId,
    },
  });
}

// --- Fotos de turnos ---

export function findAppointmentPhotos(appointmentId) {
  return prisma.appointmentPhoto.findMany({
    where: { appointmentId },
    select: APPOINTMENT_PHOTO_SELECT,
    orderBy: APPOINTMENT_PHOTO_ORDER,
  });
}

/**
 * Inserta filas de fotos ya armadas por el servicio
 * ({ appointmentId, fileId, label, position }).
 */
export function createAppointmentPhotos(rows, { skipDuplicates = false } = {}) {
  return prisma.appointmentPhoto.createMany({
    data: rows,
    skipDuplicates,
  });
}

/**
 * Transacción de actualización completa de un turno y su galería:
 *   1. Actualiza los campos base del turno.
 *   2. Borra las fotos removidas.
 *   3. Upsertea las fotos retenidas (update si traen id, create si no).
 *   4. Relee la galería fresca, pide al servicio los file IDs legacy
 *      vía `computeLegacyFileIds(freshPhotos)` y los persiste.
 *
 * Todo o nada: si algo falla, Prisma revierte la transacción entera.
 * El rollback de ARCHIVOS ya subidos no es responsabilidad de esta capa.
 *
 * @param {Object} params
 * @param {number} params.appointmentId
 * @param {Object} params.updateData - campos base ya normalizados
 * @param {number[]} params.removedPhotoIds
 * @param {Array<{id: number|null, fileId: string, label: string|null, position: number}>} params.retainedPhotos
 * @param {(photos: Array) => {beforePhotoFileId: string|null, afterPhotoFileId: string|null}} params.computeLegacyFileIds
 */
export function updateAppointmentWithPhotos({
  appointmentId,
  updateData,
  removedPhotoIds,
  retainedPhotos,
  computeLegacyFileIds,
}) {
  return prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    if (removedPhotoIds.length) {
      await tx.appointmentPhoto.deleteMany({
        where: {
          appointmentId,
          id: { in: removedPhotoIds },
        },
      });
    }

    for (const photo of retainedPhotos) {
      if (photo.id) {
        await tx.appointmentPhoto.update({
          where: { id: photo.id },
          data: {
            fileId: photo.fileId,
            label: photo.label,
            position: photo.position,
          },
        });
      } else {
        await tx.appointmentPhoto.create({
          data: {
            appointmentId,
            fileId: photo.fileId,
            label: photo.label,
            position: photo.position,
          },
        });
      }
    }

    const freshPhotos = await tx.appointmentPhoto.findMany({
      where: { appointmentId },
      select: {
        fileId: true,
        label: true,
        position: true,
      },
      orderBy: APPOINTMENT_PHOTO_ORDER,
    });

    const legacyFileIds = computeLegacyFileIds(freshPhotos);

    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        beforePhotoFileId: legacyFileIds.beforePhotoFileId,
        afterPhotoFileId: legacyFileIds.afterPhotoFileId,
      },
    });
  });
}
