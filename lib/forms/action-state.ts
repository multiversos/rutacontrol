export type FormState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status?: "error" | "idle" | "success";
};

export const initialFormState: FormState = {
  status: "idle",
};
