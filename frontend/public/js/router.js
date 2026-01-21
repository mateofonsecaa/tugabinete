import { Home, initHome } from "./views/home.js";
import { Login, initLogin } from "./views/login.js";
import { Verify, initVerify } from "./views/verify.js";
import { Register, initRegister } from "./views/register.js";
import { Dashboard, initDashboard } from "./views/dashboard.js";
import { Patients, initPatients } from "./views/patients.js";
import { Agenda, initAgenda } from "./views/agenda.js";
import { PatientNew, initPatientNew } from "./views/patient-new.js";
import { PatientDetails, initPatientDetails } from "./views/patient-details.js";
import { PatientEdit, initPatientEdit } from "./views/patient-edit.js";
import { PatientInterview, initPatientInterview } from "./views/patient-interview.js";
import { InterviewView, initInterviewView } from "./views/interview-view.js";
import { InterviewEdit1, initInterviewEdit1 } from "./views/interview-edit-1.js";
import { InterviewEdit2, initInterviewEdit2 } from "./views/interview-edit-2.js";
import { Profile, initProfile } from "./views/profile.js";
import { ProfileEdit, initProfileEdit } from "./views/profile-edit.js";
import { Treatments, initTreatments } from "./views/treatments.js";
import { Policies, initPolicies } from "./views/policies.js";
import { Terms, initTerms } from "./views/terms.js";
import { Help, initHelp } from "./views/help.js";
import { About, initAbout } from "./views/about.js";
import { Contact, initContact } from "./views/contact.js";
import { Plans, initPlans } from "./views/plans.js";

export function router() {
  const app = document.getElementById("app");
  const path = window.location.pathname;
  const token = localStorage.getItem("token");

    const setBodyViewClass = () => {
      document.body.classList.remove(
        "is-login",
        "is-register",
        "is-verify",
        "is-patient-details",
        "is-patient-edit",
        "is-interview-view",
        "is-interview-edit-1",
        "is-interview-edit-2",
        "is-treatments",
        "is-profile",
        "is-contact"
      );

      if (path === "/login") document.body.classList.add("is-login");
      else if (path === "/register") document.body.classList.add("is-register");
      else if (path === "/verify") document.body.classList.add("is-verify");
      else if (path === "/profile") {document.body.classList.add("is-profile");
        }

      // /patients/:id (details)
      else if (/^\/patients\/\d+$/.test(path)) document.body.classList.add("is-patient-details");

      else if (/^\/patients\/\d+\/edit$/.test(path)) document.body.classList.add("is-patient-edit");

      // /patients/:id/interview (view)
      else if (/^\/patients\/\d+\/interview$/.test(path)) document.body.classList.add("is-interview-view");

      // /patients/:id/interview/edit/1
      else if (/^\/patients\/\d+\/interview\/edit\/1$/.test(path)) document.body.classList.add("is-interview-edit-1");

      // /patients/:id/interview/edit/2
      else if (/^\/patients\/\d+\/interview\/edit\/2$/.test(path)) document.body.classList.add("is-interview-edit-2");

      else if (path === "/contact") document.body.classList.add("is-contact");

    };

    setBodyViewClass();

  // helper para rutas protegidas
  const requireAuth = () => {
    if (!token) {
      history.replaceState(null, "", "/login");
      app.innerHTML = Login();
      initLogin();
      return false;
    }
    return true;
  };

  // =========================
  // RUTAS PÚBLICAS
  // =========================
  if (path === "/login") {
    app.innerHTML = Login();
    initLogin();
    return;
  }

  if (path === "/register") {
    app.innerHTML = Register();
    initRegister();
    return;
  }

  if (path === "/verify") {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    app.innerHTML = Verify(status);
    initVerify();
    return;
  }

  if (path === "/policies") {
  app.innerHTML = Policies();
  initPolicies();
  return;
}

if (path === "/terms") {
  app.innerHTML = Terms();
  initTerms();
  return;
}

if (path === "/help") {
  app.innerHTML = Help();
  initHelp();
  return;
}

if (path === "/about") {
  app.innerHTML = About();
  initAbout();
  return;
}

if (path === "/contact") {
  app.innerHTML = Contact();
  initContact();
  return;
}

if (path === "/plans") {
  app.innerHTML = Plans();
  initPlans();
  return;
}

  // =========================
  // RUTAS PROTEGIDAS
  // =========================
  if (path === "/dashboard") {
    if (!requireAuth()) return;
    app.innerHTML = Dashboard();
    initDashboard();
    return;
  }

  if (path === "/patients") {
    if (!requireAuth()) return;
    app.innerHTML = Patients();
    initPatients();
    return;
  }

  if (path === "/agenda") {
    if (!requireAuth()) return;
    app.innerHTML = Agenda();
    initAgenda();
    return;
  }

  if (path === "/patients/new") {
    if (!requireAuth()) return;
    app.innerHTML = PatientNew();
    initPatientNew();
    return;
  }

  else if (path === "/treatments") document.body.classList.add("is-treatments");

  // /patients/:id/interview
  const iv = path.match(/^\/patients\/(\d+)\/interview$/);
  if (iv) {
    if (!requireAuth()) return;
    app.innerHTML = InterviewView();
    initInterviewView();
    return;
  }

  // /patients/:id/interview/edit/1
  const ie1 = path.match(/^\/patients\/(\d+)\/interview\/edit\/1$/);
  if (ie1) {
    if (!requireAuth()) return;
    app.innerHTML = InterviewEdit1();
    initInterviewEdit1();
    return;
  }

  // /patients/:id/interview/edit/2
  const ie2 = path.match(/^\/patients\/(\d+)\/interview\/edit\/2$/);
  if (ie2) {
    if (!requireAuth()) return;
    app.innerHTML = InterviewEdit2();
    initInterviewEdit2();
    return;
  }

  const patientEditMatch = path.match(/^\/patients\/(\d+)\/edit$/);
  if (patientEditMatch) {
    if (!requireAuth()) return;
    document.body.className = "is-patient-edit";
    app.innerHTML = PatientEdit();
    initPatientEdit();
    return;
  }

  // /patients/:id  (ej: /patients/123)
  const patientIdMatch = path.match(/^\/patients\/(\d+)$/);
  if (patientIdMatch) {
    if (!requireAuth()) return;
    app.innerHTML = PatientDetails();
    initPatientDetails();
    return;
  }

  if (path === "/profile") {
    if (!requireAuth()) return;
    app.innerHTML = Profile();
    initProfile();
    return;
  }

  if (path === "/profile/edit") {
  if (!requireAuth()) return;
  app.innerHTML = ProfileEdit();
  initProfileEdit();
  return;
}

if (path === "/treatments") {
  if (!requireAuth()) return;
  app.innerHTML = Treatments();
  initTreatments();
  return;
}

  // =========================
  // DEFAULT / HOME
  // =========================
  app.innerHTML = Home();
  initHome();
}
