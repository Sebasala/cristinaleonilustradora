type FormUi = {
  reviewErrors: string;
  investmentError: string;
  validation: Record<string, string>;
};

type FormDataState = {
  fullName: string;
  whatsapp: string;
  availability: string;
  motivation: string;
  paymentOption: string;
  budgetResponse: string;
};

const form = document.querySelector<HTMLFormElement>("#lead-capture-form");

if (form) {
  const ui = JSON.parse(form.dataset.ui ?? "{}") as FormUi;
  const storageKey = "cristina-leon-ilustracion-poetica-lead";
  const steps = Array.from(form.querySelectorAll<HTMLElement>("[data-step]"));
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const success = form.querySelector<HTMLElement>("[data-success]");
  let currentStep = 1;

  const getTextValue = (field: string) => {
    const control = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${field}"]`
    );
    return control?.value.trim() ?? "";
  };

  const getFormState = (): FormDataState => ({
    fullName: getTextValue("fullName"),
    whatsapp: getTextValue("whatsapp"),
    availability:
      form.querySelector<HTMLInputElement>('input[name="availability"]:checked')
        ?.value ?? "",
    motivation: getTextValue("motivation"),
    paymentOption:
      form.querySelector<HTMLInputElement>(
        'input[name="paymentOption"]:checked'
      )?.value ?? "",
    budgetResponse:
      form.querySelector<HTMLInputElement>(
        'input[name="budgetResponse"]:checked'
      )?.value ?? ""
  });

  const persist = () => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ step: currentStep, data: getFormState() })
      );
    } catch {
      // sessionStorage may be blocked by browser privacy settings.
    }
  };

  const setError = (field: string, message: string) => {
    const error = form.querySelector<HTMLElement>(
      `[data-error-for="${field}"]`
    );
    if (error) error.textContent = message;
    const controls = form.querySelectorAll<HTMLElement>(`[name="${field}"]`);
    controls.forEach((control) =>
      control.setAttribute("aria-invalid", message ? "true" : "false")
    );
  };

  const validateField = (field: string): boolean => {
    const data = getFormState();
    let message = "";

    switch (field) {
      case "fullName":
        if (data.fullName.length < 3) message = ui.validation.fullName;
        break;
      case "whatsapp":
        if (!/^3\d{9}$/.test(data.whatsapp)) message = ui.validation.whatsapp;
        break;
      case "availability":
        if (!data.availability) message = ui.validation.availability;
        break;
      case "motivation":
        if (data.motivation.length < 10) message = ui.validation.motivation;
        break;
      case "paymentOption":
        if (!data.paymentOption) message = ui.validation.paymentOption;
        break;
      case "budgetResponse":
        if (!data.budgetResponse) message = ui.validation.budgetResponse;
        break;
    }

    setError(field, message);
    return !message;
  };

  const fieldsByStep: Record<number, string[]> = {
    1: ["fullName", "whatsapp"],
    2: ["availability", "motivation"],
    3: ["paymentOption", "budgetResponse"]
  };

  const validateStep = (step: number) =>
    fieldsByStep[step].every(validateField);

  const showStep = (step: number) => {
    currentStep = step;
    steps.forEach((section) => {
      const isActive = Number(section.dataset.step) === step;
      section.hidden = !isActive;
      section.setAttribute("aria-hidden", String(!isActive));
    });
    const progressComponent = form
      .querySelector<HTMLElement>("[data-progress-step]")
      ?.closest(".progress");
    if (progressComponent) {
      progressComponent
        .querySelectorAll<HTMLElement>("[data-progress-step]")
        .forEach((item) => {
          const itemStep = Number(item.dataset.progressStep);
          item.classList.toggle("active", itemStep === step);
          item.classList.toggle("complete", itemStep < step);
        });
    }
    status?.replaceChildren();
    persist();
  };

  const restore = () => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) ?? "null"
      ) as { step?: number; data?: Partial<FormDataState> } | null;
      if (!saved?.data) return;
      const textFields = ["fullName", "whatsapp", "motivation"] as const;
      textFields.forEach((field) => {
        const control = form.elements.namedItem(field);
        if (
          control instanceof HTMLInputElement ||
          control instanceof HTMLTextAreaElement
        )
          control.value = saved.data?.[field] ?? "";
      });
      ["availability", "paymentOption", "budgetResponse"].forEach((field) => {
        const value = saved.data?.[field as keyof FormDataState];
        if (typeof value === "string" && value) {
          const control = form.querySelector<HTMLInputElement>(
            `input[name="${field}"][value="${CSS.escape(value)}"]`
          );
          if (control) control.checked = true;
        }
      });
      if (saved.step && saved.step >= 1 && saved.step <= 3)
        showStep(saved.step);
    } catch {
      // Ignore malformed or unavailable temporary storage.
    }
  };

  form.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target.name === "whatsapp")
      target.value = target.value.replace(/\D/g, "").slice(0, 10);
    if (target.name) validateField(target.name);
    persist();
  });
  form.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.name) validateField(target.name);
    persist();
  });

  form.querySelectorAll<HTMLButtonElement>("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextStep = Number(button.dataset.next);
      if (validateStep(currentStep)) showStep(nextStep);
      else status!.textContent = ui.reviewErrors;
    });
  });
  form
    .querySelectorAll<HTMLButtonElement>("[data-previous]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        showStep(Number(button.dataset.previous))
      )
    );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateStep(3)) {
      status!.textContent = ui.investmentError;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const data = getFormState();
    const payload = {
      ...data,
      countryCode: "+57",
      budgetResponse: data.budgetResponse,
      utms: Object.fromEntries(
        [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content"
        ].map((key) => [key, params.get(key) ?? ""])
      )
    };

    window.dispatchEvent(new CustomEvent("onLeadSubmit", { detail: payload }));
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Temporary storage cleanup is best effort.
    }
    form
      .querySelectorAll<HTMLElement>(
        ".form-step, .progress, .form-heading, .form-status"
      )
      .forEach((element) => element.setAttribute("hidden", "true"));
    success?.removeAttribute("hidden");
    success?.focus();
  });

  restore();
}
