import { submitLead } from "./leadDispatcher";

type FormField = HTMLInputElement | HTMLTextAreaElement;

interface StoredFormState {
  step: number;
  values: Record<string, string>;
}

const FORM_STORAGE_KEY = "lead-capture-form:ilustracion-poetica";

const isDevelopmentEnvironment = () => {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
};

const getStepControls = (form: HTMLFormElement) => {
  const steps = [...form.querySelectorAll<HTMLElement>("[data-form-step]")];
  const prevButton = form.querySelector<HTMLButtonElement>(
    '[data-step-action="prev"]'
  );
  const nextButton = form.querySelector<HTMLButtonElement>(
    '[data-step-action="next"]'
  );
  const submitButton = form.querySelector<HTMLButtonElement>(
    '[data-step-action="submit"]'
  );

  const missingControls: (string | false)[] = [
    !steps.length && "steps",
    !prevButton && "prev button",
    !nextButton && "next button",
    !submitButton && "submit button"
  ].filter(Boolean);

  if (missingControls.length || !prevButton || !nextButton || !submitButton) {
    if (isDevelopmentEnvironment()) {
      console.warn(
        "Lead capture form is missing required step controls:",
        missingControls.join(", ")
      );
    }
    return null;
  }

  return { steps, prevButton, nextButton, submitButton };
};

const getFormControls = () => {
  const form = document.getElementById("lead-capture-form");
  if (!(form instanceof HTMLFormElement)) {
    if (isDevelopmentEnvironment()) {
      console.warn("Lead capture form not found on the page.");
    }
    return null;
  }

  const stepControls = getStepControls(form);
  if (!stepControls) {
    return null;
  }

  return { form, ...stepControls };
};

const getStepFields = (stepElement: HTMLElement): FormField[] =>
  [...stepElement.querySelectorAll<FormField>("input, textarea")].filter(
    (field) => field.name
  );

const isFieldValid = (field: FormField) => {
  if (
    field instanceof HTMLInputElement &&
    (field.type === "radio" || field.type === "checkbox")
  ) {
    return field.checkValidity();
  }

  const value = field.value.trim();
  return (
    field.checkValidity() &&
    (!field.required || value.length > 0) &&
    (field.minLength < 0 ||
      value.length === 0 ||
      value.length >= field.minLength)
  );
};

const setFieldErrorState = (
  form: HTMLFormElement,
  field: FormField,
  shouldShowError: boolean
) => {
  const fields = getNamedFields(form).filter(
    (namedField) => namedField.name === field.name
  );

  fields.forEach((namedField) => {
    namedField.setAttribute("aria-invalid", String(shouldShowError));
  });

  const fieldWrapper = field.closest<HTMLElement>("[data-field-wrapper]");
  fieldWrapper?.classList.toggle("invalid", shouldShowError);
  const errorElement = fieldWrapper?.querySelector<HTMLElement>(".field-error");
  if (errorElement) {
    errorElement.hidden = !shouldShowError;
  }
};

const validateField = (
  form: HTMLFormElement,
  field: FormField,
  shouldShowError: boolean
) => {
  const isValid = isFieldValid(field);
  setFieldErrorState(form, field, shouldShowError && !isValid);
  return isValid;
};

const getFirstInvalidStep = (form: HTMLFormElement, steps: HTMLElement[]) => {
  for (let index = 0; index < steps.length; index++) {
    const invalidField = getStepFields(steps[index]).find(
      (field) => !validateField(form, field, true)
    );
    if (invalidField) {
      return { index, field: invalidField };
    }
  }

  return null;
};

const isCurrentStepValid = (
  form: HTMLFormElement,
  steps: HTMLElement[],
  currentStepIndex: number
) => {
  const fields = getStepFields(steps[currentStepIndex]);

  for (const field of fields) {
    if (!validateField(form, field, true)) {
      field.focus();
      return false;
    }
  }

  return true;
};

const isCurrentStepValidSilently = (
  steps: HTMLElement[],
  currentStepIndex: number
) =>
  getStepFields(steps[currentStepIndex]).every((field) => isFieldValid(field));

const updateStepActionButtonState = (
  steps: HTMLElement[],
  nextButton: HTMLButtonElement,
  submitButton: HTMLButtonElement,
  currentStepIndex: number
) => {
  const isStepInvalid = !isCurrentStepValidSilently(steps, currentStepIndex);
  nextButton.classList.toggle("is-disabled", isStepInvalid);
  submitButton.classList.toggle("is-disabled", isStepInvalid);
  submitButton.disabled = isStepInvalid;
};

const updateStepUI = (
  steps: HTMLElement[],
  prevButton: HTMLButtonElement,
  nextButton: HTMLButtonElement,
  submitButton: HTMLButtonElement,
  currentStepIndex: number
) => {
  const progressSteps = [
    ...document.querySelectorAll<HTMLElement>(
      "#lead-capture-form [data-step-pill]"
    )
  ];

  steps.forEach((step, index) => {
    const isActive = index === currentStepIndex;
    step.hidden = !isActive;
    step.classList.toggle("is-active", isActive);

    const progressStep = progressSteps[index];
    if (progressStep) {
      progressStep.classList.toggle("is-active", isActive);
      progressStep.classList.toggle("is-completed", index < currentStepIndex);
    }
  });

  prevButton.hidden = currentStepIndex === 0;
  nextButton.hidden = currentStepIndex === steps.length - 1;
  submitButton.hidden = currentStepIndex !== steps.length - 1;
};

const readStoredFormState = (): StoredFormState | null => {
  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredFormState) : null;
  } catch {
    return null;
  }
};

const writeStoredFormState = (state: StoredFormState) => {
  try {
    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures (e.g. private browsing, quota exceeded).
  }
};

const clearStoredFormState = () => {
  try {
    window.localStorage.removeItem(FORM_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const getNamedFields = (form: HTMLFormElement): FormField[] =>
  [...form.elements]
    .filter(
      (field): field is FormField =>
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
    )
    .filter((field) => field.name);

const isFieldEmpty = (form: HTMLFormElement, field: FormField) => {
  if (
    field instanceof HTMLInputElement &&
    (field.type === "radio" || field.type === "checkbox")
  ) {
    return !getNamedFields(form).some(
      (namedField) =>
        namedField instanceof HTMLInputElement &&
        namedField.name === field.name &&
        namedField.checked
    );
  }

  return field.value.trim().length === 0;
};

const validateRestoredFields = (form: HTMLFormElement) => {
  getNamedFields(form).forEach((field) => {
    validateField(form, field, !isFieldEmpty(form, field));
  });
};

const normalizePhoneNumber = (field: FormField) => {
  if (field instanceof HTMLInputElement && field.type === "tel") {
    field.value = field.value
      .replace(/^\s*\+57[\s-]*/, "")
      .replace(/[^\d\s-]/g, "");
  }
};

const focusFirstEmptyOrInvalidField = (
  form: HTMLFormElement,
  step: HTMLElement
) => {
  getStepFields(step)
    .find((field) => {
      // Checkboxes/radios shouldn't be auto-focused just for being unchecked, only when truly invalid.
      const isCheckable =
        field instanceof HTMLInputElement &&
        (field.type === "checkbox" || field.type === "radio");
      return (
        !isCheckable && (isFieldEmpty(form, field) || !isFieldValid(field))
      );
    })
    ?.focus();
};

const collectFormValues = (form: HTMLFormElement): Record<string, string> => {
  const values: Record<string, string> = {};

  getNamedFields(form).forEach((field) => {
    if (
      field instanceof HTMLInputElement &&
      (field.type === "radio" || field.type === "checkbox")
    ) {
      if (field.checked) {
        values[field.name] = field.value;
      }
    } else {
      values[field.name] = field.value;
    }
  });

  return values;
};

const updateSuccessWhatsappMessage = (
  successElement: HTMLElement,
  name: string
) => {
  const whatsappLink = successElement.querySelector<HTMLAnchorElement>(
    "[data-success-whatsapp]"
  );
  const messageTemplate = whatsappLink?.dataset.whatsappMessage;

  if (!whatsappLink || !messageTemplate || !name) {
    return;
  }

  const whatsappUrl = new URL(whatsappLink.href);
  whatsappUrl.searchParams.set(
    "text",
    messageTemplate.replace("{nombre}", name)
  );
  whatsappLink.href = whatsappUrl.toString();
};

const applyFormValues = (
  form: HTMLFormElement,
  values: Record<string, string> | undefined
) => {
  if (!values) {
    return;
  }

  const namedFields = getNamedFields(form);
  namedFields.forEach((field) => {
    if (!(field.name in values)) {
      return;
    }

    const storedValue = values[field.name];
    if (
      field instanceof HTMLInputElement &&
      (field.type === "radio" || field.type === "checkbox")
    ) {
      field.checked = field.value === storedValue;
    } else {
      field.value = storedValue;
    }
  });
};

const saveFormProgress = (form: HTMLFormElement, currentStepIndex: number) => {
  writeStoredFormState({
    step: currentStepIndex,
    values: collectFormValues(form)
  });
};

export const initializeLeadCaptureForm = () => {
  const formControls = getFormControls();
  if (!formControls) {
    return;
  }

  const { form, steps, prevButton, nextButton, submitButton } = formControls;
  const storedState = readStoredFormState();
  applyFormValues(form, storedState?.values);
  validateRestoredFields(form);

  let currentStepIndex = 0;
  if (storedState && Number.isInteger(storedState.step)) {
    currentStepIndex = Math.min(
      Math.max(storedState.step, 0),
      steps.length - 1
    );
  }

  const touchedFieldNames = new Set<string>();

  steps.forEach((step) => {
    getStepFields(step).forEach((field) => {
      const saveProgress = () => {
        normalizePhoneNumber(field);
        const wasInvalid = field.getAttribute("aria-invalid") === "true";
        if (touchedFieldNames.has(field.name) || wasInvalid) {
          validateField(form, field, true);
        }
        updateStepActionButtonState(
          steps,
          nextButton,
          submitButton,
          currentStepIndex
        );
        saveFormProgress(form, currentStepIndex);
      };

      field.addEventListener("input", saveProgress);
      field.addEventListener("change", () => {
        if (
          field instanceof HTMLInputElement &&
          (field.type === "checkbox" || field.type === "radio")
        ) {
          touchedFieldNames.add(field.name);
        }
        saveProgress();
      });
      field.addEventListener("blur", () => {
        touchedFieldNames.add(field.name);
        validateField(form, field, true);
      });
    });
  });

  prevButton.addEventListener("click", () => {
    if (currentStepIndex === 0) {
      return;
    }

    currentStepIndex -= 1;
    updateStepUI(steps, prevButton, nextButton, submitButton, currentStepIndex);
    updateStepActionButtonState(
      steps,
      nextButton,
      submitButton,
      currentStepIndex
    );
    saveFormProgress(form, currentStepIndex);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  nextButton.addEventListener("click", () => {
    if (!isCurrentStepValid(form, steps, currentStepIndex)) {
      return;
    }

    currentStepIndex += 1;
    updateStepUI(steps, prevButton, nextButton, submitButton, currentStepIndex);
    updateStepActionButtonState(
      steps,
      nextButton,
      submitButton,
      currentStepIndex
    );
    saveFormProgress(form, currentStepIndex);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    focusFirstEmptyOrInvalidField(form, steps[currentStepIndex]);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const invalidStep = getFirstInvalidStep(form, steps);
    if (invalidStep) {
      currentStepIndex = invalidStep.index;
      updateStepUI(
        steps,
        prevButton,
        nextButton,
        submitButton,
        currentStepIndex
      );
      updateStepActionButtonState(
        steps,
        nextButton,
        submitButton,
        currentStepIndex
      );
      invalidStep.field.focus();
      return;
    }

    const statusElement = form.querySelector<HTMLElement>("[data-form-status]");
    const successElement =
      document.querySelector<HTMLElement>("[data-success]");

    submitButton.disabled = true;
    if (statusElement) {
      statusElement.textContent = "Enviando tu información...";
    }

    const values = collectFormValues(form);
    const result = await submitLead(values);

    submitButton.disabled = false;
    clearStoredFormState();

    if (statusElement) {
      statusElement.textContent = result.ok
        ? ""
        : "No pudimos confirmar el envío en línea, pero guardamos tus datos para intentarlo de nuevo.";
    }

    form.hidden = true;
    if (successElement) {
      updateSuccessWhatsappMessage(successElement, values.nombre?.trim() ?? "");
      successElement.hidden = false;
      successElement.focus();
    }
  });

  updateStepUI(steps, prevButton, nextButton, submitButton, currentStepIndex);
  updateStepActionButtonState(
    steps,
    nextButton,
    submitButton,
    currentStepIndex
  );
  if (storedState && Object.keys(storedState.values).length > 0) {
    focusFirstEmptyOrInvalidField(form, steps[currentStepIndex]);
  }
};
