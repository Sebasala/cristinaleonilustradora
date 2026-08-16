export type Paso = {
  numero: number;
  title: string;
  fields: string[];
};

export type Precio = {
  valorTotal: string;
  descripcion: string;
  facilidadesPago: string[];
};

export type FieldCopy = {
  label: string;
  help?: string;
  placeholder?: string;
  options?: string[];
};

export type UiCopy = {
  progressLabel: string;
  back: string;
  continueAvailability: string;
  continueInvestment: string;
  submit: string;
  successTitle: string;
  successMessage: string;
  reviewErrors: string;
  investmentError: string;
  priceLabel: string;
  validation: Record<string, string>;
};

export type FormularioContent = {
  title: string;
  heading: string;
  description: string;
  ui: UiCopy;
  pasos: Paso[];
  fields: Record<string, FieldCopy>;
  precio: Precio;
};
