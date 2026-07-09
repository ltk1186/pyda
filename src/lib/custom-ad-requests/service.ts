import {
  buildCustomAdRequestInsertPayload,
  type CustomAdRequestInput,
  type CustomAdRequestInsertPayload,
} from "./core";

export type CustomAdRequestSubmissionResult =
  | {
      ok: true;
      id: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function submitCustomAdRequestWithDependencies(input: {
  request: CustomAdRequestInput;
  userId: string | null;
  insert: (payload: CustomAdRequestInsertPayload) => Promise<{ id: string }>;
  notify: (input: {
    id: string;
    request: CustomAdRequestInput;
  }) => Promise<unknown>;
}): Promise<CustomAdRequestSubmissionResult> {
  const payload = buildCustomAdRequestInsertPayload({
    request: input.request,
    userId: input.userId,
  });

  let inserted: { id: string };

  try {
    inserted = await input.insert(payload);
  } catch {
    return {
      ok: false,
      message: "광고 문의를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  try {
    await input.notify({
      id: inserted.id,
      request: input.request,
    });
  } catch {
    // Notification is operationally useful, but request persistence is primary.
  }

  return {
    ok: true,
    id: inserted.id,
  };
}
