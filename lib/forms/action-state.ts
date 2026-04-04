export type FormState = {
  entityId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status?: "error" | "idle" | "success";
};

export const initialFormState: FormState = {
  status: "idle",
};
