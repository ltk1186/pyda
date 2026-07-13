"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import type { CreatorOnboardingFormState } from "@/app/creator/onboarding/actions";
import { buildKakaoStartPath } from "@/components/auth/kakao-login-button";
import {
  allowedImageMimeTypes,
  maxListingImageBytes,
} from "@/lib/admin/listing-core";
import {
  applyRecommendedOnboardingPriceValues,
  calculateOnboardingTotalPrice,
  getOnboardingAdSlotDefinition,
  getOnboardingErrorStep,
  getOnboardingSlotPresentation,
  getOnboardingSlotPriceChoices,
  getOnboardingSlotSelection,
  onboardingAdSlots,
  onboardingMentionSeconds,
  onboardingTurnaroundDays,
  validateCreatorOnboardingInput,
  type InstagramExistingPlacement,
  type OnboardingAdSlot,
  type OnboardingOptionKey,
  type OnboardingPlatform,
} from "@/lib/creator/onboarding-core";
import {
  readCreatorOnboardingDraft,
  validateCreatorOnboardingDraft,
  writeCreatorOnboardingDraft,
  type CreatorOnboardingDraft,
} from "@/lib/creator/onboarding-draft";

type CreatorOnboardingFormProps = {
  action: (
    state: CreatorOnboardingFormState,
    formData: FormData,
  ) => Promise<CreatorOnboardingFormState>;
  isAuthenticated: boolean;
};

const initialState: CreatorOnboardingFormState = {};
const maxImageSide = 1600;

export function CreatorOnboardingForm({
  action,
  isAuthenticated,
}: CreatorOnboardingFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [adSlot, setAdSlot] = useState<OnboardingAdSlot | "">("");
  const [instagramExistingPlacement, setInstagramExistingPlacement] =
    useState<InstagramExistingPlacement>("profile_link");
  const [mentionSeconds, setMentionSeconds] = useState("30");
  const [youtubeName, setYoutubeName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeAudienceSize, setYoutubeAudienceSize] = useState("");
  const [instagramName, setInstagramName] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [instagramAudienceSize, setInstagramAudienceSize] = useState("");
  const [useDifferentDisplayName, setUseDifferentDisplayName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [placementFeeManwon, setPlacementFeeManwon] = useState("");
  const [productionFeeManwon, setProductionFeeManwon] = useState("0");
  const [placementFeeTouched, setPlacementFeeTouched] = useState(false);
  const [productionFeeTouched, setProductionFeeTouched] = useState(false);
  const [hasSeparateProductionFee, setHasSeparateProductionFee] =
    useState(false);
  const [turnaroundDays, setTurnaroundDays] = useState("14");
  const [maintenanceDays, setMaintenanceDays] = useState("14");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [clientErrors, setClientErrors] =
    useState<CreatorOnboardingFormState["errors"]>();
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);

  const selection = useMemo(
    () =>
      adSlot
        ? getOnboardingSlotSelection({
            adSlot,
            instagramPlacement: instagramExistingPlacement,
          })
        : null,
    [adSlot, instagramExistingPlacement],
  );
  const selectedPlatform: OnboardingPlatform =
    selection?.platform ?? "YouTube";
  const inventoryType = selection?.inventoryType ?? "new_content";
  const optionKeys = selection?.optionKeys ?? [];
  const selectedChannelName =
    selectedPlatform === "YouTube" ? youtubeName : instagramName;
  const effectiveDisplayName = useDifferentDisplayName
    ? displayName
    : selectedChannelName;
  const effectiveProductionFee =
    inventoryType === "new_content" && hasSeparateProductionFee
      ? productionFeeManwon
      : "0";
  const errors = clientErrors;
  const totalPrice = calculateOnboardingTotalPrice({
    placementFeeKrw: manwonToKrw(placementFeeManwon),
    productionFeeKrw: manwonToKrw(effectiveProductionFee),
  });

  const formAction = async (
    previousState: CreatorOnboardingFormState,
    formData: FormData,
  ) => {
    setClientErrors(undefined);
    const result = await action(previousState, formData);
    if (result.errors) {
      showValidationErrors(result.errors);
    }
    return result;
  };
  const [state, submitAction] = useActionState(formAction, initialState);

  useEffect(() => {
    const draft = readDraftFromSession();
    if (!draft) {
      return;
    }

    const restoreTimer = window.setTimeout(() => {
      setAdSlot(draft.adSlot);
      setInstagramExistingPlacement(draft.instagramExistingPlacement);
      setMentionSeconds(draft.mentionSeconds);
      setYoutubeName(draft.youtubeName);
      setYoutubeUrl(draft.youtubeUrl);
      setYoutubeAudienceSize(draft.youtubeAudienceSize);
      setInstagramName(draft.instagramName);
      setInstagramUrl(draft.instagramUrl);
      setInstagramAudienceSize(draft.instagramAudienceSize);
      setUseDifferentDisplayName(draft.useDifferentDisplayName);
      setDisplayName(draft.displayName);
      setBio(draft.bio);
      setPlacementFeeManwon(draft.placementFeeManwon);
      setProductionFeeManwon(draft.productionFeeManwon);
      setPlacementFeeTouched(draft.placementFeeTouched);
      setProductionFeeTouched(draft.productionFeeTouched);
      setHasSeparateProductionFee(draft.hasSeparateProductionFee);
      setTurnaroundDays(draft.turnaroundDays);
      setMaintenanceDays(draft.maintenanceDays);
      setStep(3);
      setRestoredDraft(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  function chooseSlot(nextSlot: OnboardingAdSlot) {
    setAdSlot(nextSlot);
    setClientErrors(undefined);
    const nextDefinition = getOnboardingAdSlotDefinition(nextSlot);
    const recommended = applyRecommendedOnboardingPriceValues({
      currentPlacementFeeManwon: placementFeeManwon,
      currentProductionFeeManwon: productionFeeManwon,
      placementFeeTouched,
      productionFeeTouched,
      platform: nextDefinition.platform,
      inventoryType: nextDefinition.inventoryType,
    });
    setPlacementFeeManwon(recommended.placementFeeManwon);
    if (hasSeparateProductionFee) {
      setProductionFeeManwon(recommended.productionFeeManwon);
    }
  }

  function goToNextStep() {
    setDraftMessage(null);
    if (step === 1 && !adSlot) {
      setClientErrors({ adSlot: "열어둘 광고 자리를 선택해주세요." });
      return;
    }
    if (step === 2) {
      const stepErrors = validateChannelStep();
      if (stepErrors) {
        showValidationErrors(stepErrors);
        return;
      }
    }
    setClientErrors(undefined);
    setStep((current) => Math.min(3, current + 1) as 1 | 2 | 3);
  }

  function validateChannelStep() {
    if (!adSlot) {
      return { adSlot: "열어둘 광고 자리를 선택해주세요." };
    }
    const parsed = validateCreatorOnboardingInput(
      Object.assign({}, buildValidationInput(), {
        placementFeeManwon: placementFeeManwon || "1",
        productionFeeManwon: "0",
        turnaroundDays: "14",
        maintenanceDays: "14",
      }),
    );
    if (parsed.ok) {
      return null;
    }
    const channelErrors = Object.fromEntries(
      Object.entries(parsed.errors).filter(([field]) =>
        [
          "displayName",
          "selectedPlatform",
          "youtubeName",
          "youtubeUrl",
          "youtubeAudienceSize",
          "instagramName",
          "instagramUrl",
          "instagramAudienceSize",
        ].includes(field),
      ),
    );
    return Object.keys(channelErrors).length > 0 ? channelErrors : null;
  }

  function buildValidationInput() {
    return {
      adSlot,
      displayName: effectiveDisplayName,
      bio,
      youtubeName,
      youtubeUrl,
      youtubeAudienceSize,
      instagramName,
      instagramUrl,
      instagramAudienceSize,
      selectedPlatform,
      inventoryType,
      optionKeys,
      placementFeeManwon,
      productionFeeManwon: effectiveProductionFee,
      turnaroundDays,
      maintenanceDays,
      mentionSeconds,
      storyCount: "",
    };
  }

  function buildDraft(): CreatorOnboardingDraft | null {
    if (!adSlot) {
      return null;
    }
    return {
      step: 3,
      adSlot,
      instagramExistingPlacement,
      useDifferentDisplayName,
      hasSeparateProductionFee,
      displayName,
      bio,
      youtubeName,
      youtubeUrl,
      youtubeAudienceSize,
      instagramName,
      instagramUrl,
      instagramAudienceSize,
      selectedPlatform,
      inventoryType,
      optionKeys,
      placementFeeManwon,
      productionFeeManwon,
      placementFeeTouched,
      productionFeeTouched,
      turnaroundDays,
      maintenanceDays,
      mentionSeconds,
    };
  }

  function validateFinalDraft() {
    const draft = buildDraft();
    if (!draft) {
      const nextErrors = { adSlot: "열어둘 광고 자리를 선택해주세요." };
      showValidationErrors(nextErrors);
      return null;
    }
    const parsed = validateCreatorOnboardingDraft({
      ...draft,
      displayName: effectiveDisplayName,
    });
    if (!parsed.ok) {
      showValidationErrors(parsed.errors);
      return null;
    }
    return { ...draft, displayName: effectiveDisplayName };
  }

  function connectKakaoAndResume(event: FormEvent) {
    event.preventDefault();
    const draft = validateFinalDraft();
    if (!draft) {
      return;
    }
    if (!writeDraftToSession(draft)) {
      setDraftMessage(
        "작성 내용을 임시 저장하지 못했습니다. 브라우저 설정을 확인한 뒤 다시 시도해주세요.",
      );
      return;
    }
    window.location.assign(
      buildKakaoStartPath("/creator/onboarding?resume=1"),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isAuthenticated) {
      event.preventDefault();
      connectKakaoAndResume(event);
      return;
    }
    const draft = validateFinalDraft();
    if (!draft) {
      event.preventDefault();
      return;
    }
    writeDraftToSession(draft);
  }

  function showValidationErrors(nextErrors: CreatorOnboardingFormState["errors"]) {
    if (!nextErrors) {
      return;
    }
    setClientErrors(nextErrors);
    setStep(getOnboardingErrorStep(nextErrors));
    window.setTimeout(() => {
      const firstErrorField = Object.keys(nextErrors)[0];
      const target = document.querySelector<HTMLElement>(
        `[name="${firstErrorField}"]`,
      );
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  async function handleImage(file: File | undefined) {
    if (!file) {
      clearImage();
      return;
    }
    if (!allowedImageMimeTypes.includes(file.type as never)) {
      setImageMessage("JPEG, PNG, WebP 이미지만 선택할 수 있습니다.");
      clearImage();
      return;
    }
    if (file.size > maxListingImageBytes) {
      setImageMessage("이미지는 1장당 최대 5MB까지 선택할 수 있습니다.");
      clearImage();
      return;
    }

    try {
      const resized = await resizeImage(file);
      const transfer = new DataTransfer();
      transfer.items.add(resized);
      if (fileInputRef.current) {
        fileInputRef.current.files = transfer.files;
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(resized));
      setImageMessage(null);
    } catch {
      setImageMessage("이미지를 준비하지 못했습니다. 다른 이미지를 선택해주세요.");
      clearImage();
    }
  }

  function clearImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreviewUrl(null);
  }

  return (
    <form
      action={submitAction}
      className="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white shadow-[0_18px_50px_rgba(52,43,35,0.08)]"
      onSubmit={handleSubmit}
    >
      <input name="displayName" type="hidden" value={effectiveDisplayName} />
      <input name="bio" type="hidden" value={bio} />
      <input name="selectedPlatform" type="hidden" value={selectedPlatform} />
      <input name="inventoryType" type="hidden" value={inventoryType} />
      {optionKeys.map((optionKey) => (
        <input key={optionKey} name="optionKeys" type="hidden" value={optionKey} />
      ))}
      <StepNav step={step} />

      {restoredDraft && isAuthenticated ? (
        <p
          className="mx-5 mt-5 rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-ink)] sm:mx-8"
          role="status"
        >
          작성한 내용을 불러왔습니다. 마지막으로 확인하고 등록 신청해 주세요.
        </p>
      ) : null}

      <section className={step === 1 ? "px-5 py-7 sm:px-8 sm:py-9" : "hidden"}>
        <SectionTitle
          description="처음에는 하나만 골라도 됩니다. 나중에 다른 자리도 추가할 수 있어요."
          title="어떤 광고 자리를 열 수 있나요?"
        />
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {onboardingAdSlots.map((slot) => {
            const definition = getOnboardingAdSlotDefinition(slot);
            return (
              <SlotCard
                checked={adSlot === slot}
                definition={definition}
                key={slot}
                onChange={() => chooseSlot(slot)}
              />
            );
          })}
        </div>
        <FieldError message={errors?.adSlot} />

        {adSlot === "youtube_video_mention" ? (
          <ChoiceField
            label="영상에서 얼마나 소개할까요?"
            name="mentionSeconds"
            onChange={setMentionSeconds}
            options={onboardingMentionSeconds.map((seconds) => ({
              value: `${seconds}`,
              label: `${seconds}초`,
            }))}
            value={mentionSeconds}
          />
        ) : null}

        {adSlot === "instagram_profile_or_highlight" ? (
          <ChoiceField
            label="어디에 광고를 보여줄까요?"
            name="instagramExistingPlacement"
            onChange={(value) =>
              setInstagramExistingPlacement(value as InstagramExistingPlacement)
            }
            options={[
              { value: "profile_link", label: "프로필 링크" },
              { value: "highlight", label: "스토리 하이라이트" },
            ]}
            value={instagramExistingPlacement}
          />
        ) : null}
        <FieldError message={errors?.optionKeys ?? errors?.mentionSeconds} />
      </section>

      <section className={step === 2 ? "px-5 py-7 sm:px-8 sm:py-9" : "hidden"}>
        <SectionTitle
          description={`${selectedPlatform}에서 실제로 운영하는 채널 정보만 알려주세요.`}
          title="이 자리는 어느 채널에 있나요?"
        />
        <div className="mt-7 space-y-5">
          {selectedPlatform === "YouTube" ? (
            <>
              <TextField
                error={errors?.youtubeName}
                label="YouTube 채널명"
                name="youtubeName"
                onChange={setYoutubeName}
                placeholder="제주한바퀴"
                value={youtubeName}
              />
              <TextField
                error={errors?.youtubeUrl}
                label="채널 주소"
                name="youtubeUrl"
                onChange={setYoutubeUrl}
                placeholder="https://youtube.com/@channel"
                value={youtubeUrl}
              />
              <TextField
                description="현재 공개된 숫자를 적어주세요."
                error={errors?.youtubeAudienceSize}
                inputMode="numeric"
                label="구독자 수"
                name="youtubeAudienceSize"
                onChange={setYoutubeAudienceSize}
                value={youtubeAudienceSize}
              />
              <input name="instagramName" type="hidden" value="" />
              <input name="instagramUrl" type="hidden" value="" />
              <input name="instagramAudienceSize" type="hidden" value="" />
            </>
          ) : (
            <>
              <TextField
                error={errors?.instagramName}
                label="Instagram 계정명"
                name="instagramName"
                onChange={setInstagramName}
                placeholder="today.jeju"
                value={instagramName}
              />
              <TextField
                error={errors?.instagramUrl}
                label="계정 주소"
                name="instagramUrl"
                onChange={setInstagramUrl}
                placeholder="https://instagram.com/account"
                value={instagramUrl}
              />
              <TextField
                description="현재 공개된 숫자를 적어주세요."
                error={errors?.instagramAudienceSize}
                inputMode="numeric"
                label="팔로워 수"
                name="instagramAudienceSize"
                onChange={setInstagramAudienceSize}
                value={instagramAudienceSize}
              />
              <input name="youtubeName" type="hidden" value="" />
              <input name="youtubeUrl" type="hidden" value="" />
              <input name="youtubeAudienceSize" type="hidden" value="" />
            </>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm">
            <input
              checked={useDifferentDisplayName}
              className="mt-0.5 size-4"
              onChange={(event) => setUseDifferentDisplayName(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="font-medium text-neutral-900">
                채널명과 다른 활동명을 사용해요
              </span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">
                선택하지 않으면 채널명을 활동명으로 사용합니다.
              </span>
            </span>
          </label>
          {useDifferentDisplayName ? (
            <TextField
              error={errors?.displayName}
              label="활동명"
              name="displayNameField"
              onChange={setDisplayName}
              placeholder="제주한바퀴"
              value={displayName}
            />
          ) : null}

          <details className="rounded-xl border border-neutral-200 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-neutral-700">
              한 줄 소개 추가하기 (선택)
            </summary>
            <div className="mt-4">
              <TextArea
                label="채널 한 줄 소개"
                onChange={setBio}
                placeholder="제주의 작은 공간을 영상으로 소개합니다."
                value={bio}
              />
            </div>
          </details>
          <FieldError message={errors?.selectedPlatform} />
        </div>
      </section>

      <section className={step === 3 ? "px-5 py-7 sm:px-8 sm:py-9" : "hidden"}>
        <SectionTitle
          description="처음 정하는 희망 가격입니다. 실제 조건에 따라 광고주와 조율할 수 있어요."
          title="이 자리를 얼마에 열어둘까요?"
        />
        {adSlot ? (
          <div className="mt-7 space-y-6">
            <PriceChoice
              error={errors?.placementFeeManwon}
              onChange={(value) => {
                setPlacementFeeTouched(true);
                setPlacementFeeManwon(value);
              }}
              options={getOnboardingSlotPriceChoices(adSlot)}
              value={placementFeeManwon}
            />

            {inventoryType === "new_content" ? (
              <>
                <fieldset>
                  <legend className="text-sm font-semibold text-neutral-950">
                    촬영이나 편집 비용이 따로 필요한가요?
                  </legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <ToggleChoice
                      checked={!hasSeparateProductionFee}
                      label="아니요, 위 가격에 포함할게요"
                      onChange={() => {
                        setHasSeparateProductionFee(false);
                      }}
                    />
                    <ToggleChoice
                      checked={hasSeparateProductionFee}
                      label="네, 제작비를 따로 받을게요"
                      onChange={() => {
                        setHasSeparateProductionFee(true);
                        if (!productionFeeTouched) {
                          const recommended = applyRecommendedOnboardingPriceValues({
                            currentPlacementFeeManwon: placementFeeManwon,
                            currentProductionFeeManwon: productionFeeManwon,
                            placementFeeTouched,
                            productionFeeTouched,
                            platform: selectedPlatform,
                            inventoryType,
                          });
                          setProductionFeeManwon(recommended.productionFeeManwon);
                        }
                      }}
                    />
                  </div>
                </fieldset>
                {hasSeparateProductionFee ? (
                  <ManwonField
                    description="방문, 촬영, 편집에 필요한 별도 금액입니다."
                    error={errors?.productionFeeManwon}
                    label="제작비"
                    name="productionFeeManwon"
                    onChange={(value) => {
                      setProductionFeeTouched(true);
                      setProductionFeeManwon(value);
                    }}
                    value={productionFeeManwon}
                  />
                ) : (
                  <input name="productionFeeManwon" type="hidden" value="0" />
                )}
                <ChoiceField
                  label="보통 언제까지 만들 수 있나요?"
                  name="turnaroundDays"
                  onChange={setTurnaroundDays}
                  options={onboardingTurnaroundDays.map((days) => ({
                    value: `${days}`,
                    label: `${days}일 이내`,
                  }))}
                  value={turnaroundDays}
                />
                <FieldError message={errors?.turnaroundDays} />
                <input name="maintenanceDays" type="hidden" value="" />
              </>
            ) : (
              <>
                <input name="productionFeeManwon" type="hidden" value="0" />
                <ChoiceField
                  label="얼마 동안 광고를 유지할까요?"
                  name="maintenanceDays"
                  onChange={setMaintenanceDays}
                  options={[7, 14, 30].map((days) => ({
                    value: `${days}`,
                    label: `${days}일`,
                  }))}
                  value={maintenanceDays}
                />
                <FieldError message={errors?.maintenanceDays} />
                <input name="turnaroundDays" type="hidden" value="" />
              </>
            )}

            {isAuthenticated ? (
              <ImageField
                error={imageMessage ?? errors?.image}
                fileInputRef={fileInputRef}
                onChange={handleImage}
                onClear={clearImage}
                previewUrl={previewUrl}
              />
            ) : (
              <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-600">
                대표 이미지는 카카오 연결 후 선택할 수 있어요. 없어도 신청할 수
                있습니다.
              </div>
            )}

            <OnboardingPreview
              adSlot={adSlot}
              channelName={selectedChannelName}
              maintenanceDays={maintenanceDays}
              mentionSeconds={mentionSeconds}
              optionKeys={optionKeys}
              placementFeeKrw={manwonToKrw(placementFeeManwon)}
              productionFeeKrw={manwonToKrw(effectiveProductionFee)}
              totalPrice={totalPrice}
              turnaroundDays={turnaroundDays}
            />
          </div>
        ) : null}
      </section>

      <div className="px-5 sm:px-8">
        {draftMessage || state.message ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="status">
            {draftMessage ?? state.message}
          </p>
        ) : null}
      </div>

      <footer className="flex items-center gap-3 border-t border-neutral-200 bg-neutral-50/80 px-5 py-5 sm:px-8">
        {step > 1 ? (
          <button
            className="brand-outline min-h-12 rounded-xl border px-5 text-sm font-semibold"
            onClick={() => setStep((current) => Math.max(1, current - 1) as 1 | 2 | 3)}
            type="button"
          >
            이전
          </button>
        ) : null}
        {step < 3 ? (
          <button
            className="brand-primary ml-auto min-h-12 rounded-xl border px-6 text-sm font-semibold"
            onClick={goToNextStep}
            type="button"
          >
            다음
          </button>
        ) : isAuthenticated ? (
          <SubmitButton />
        ) : (
          <button
            className="brand-primary ml-auto min-h-12 rounded-xl border px-5 text-sm font-semibold"
            onClick={connectKakaoAndResume}
            type="button"
          >
            카카오로 연결하고 등록 확인하기
          </button>
        )}
      </footer>
      {step === 3 && !isAuthenticated ? (
        <p className="bg-neutral-50/80 px-5 pb-5 text-xs leading-5 text-neutral-500 sm:px-8">
          계정을 연결하기 전에는 아무 내용도 제출되지 않습니다.
        </p>
      ) : null}
    </form>
  );
}

function StepNav({ step }: { step: number }) {
  const labels = ["광고 자리", "채널", "가격과 확인"];
  return (
    <header className="border-b border-neutral-200 px-5 pb-4 pt-5 sm:px-8 sm:pt-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-neutral-900">첫 광고 자리 등록</p>
        <p className="text-xs font-medium text-neutral-500">{step} / 3</p>
      </div>
      <div
        aria-label={`3단계 중 ${step}단계: ${labels[step - 1]}`}
        aria-valuemax={3}
        aria-valuemin={1}
        aria-valuenow={step}
        className="mt-4 h-1 overflow-hidden rounded-full bg-neutral-100"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] motion-reduce:transition-none"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-medium text-neutral-400 sm:text-xs">
        {labels.map((label, index) => (
          <span className={step === index + 1 ? "text-[var(--brand-ink)]" : ""} key={label}>
            {label}
          </span>
        ))}
      </div>
    </header>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}

function SlotCard({
  checked,
  definition,
  onChange,
}: {
  checked: boolean;
  definition: ReturnType<typeof getOnboardingAdSlotDefinition>;
  onChange: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border p-4 transition ${
        checked
          ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] ring-1 ring-[var(--brand-primary)]"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        name="adSlot"
        onChange={onChange}
        type="radio"
        value={definition.id}
      />
      <SlotMiniature slot={definition.id} />
      <span className="mt-4 block font-semibold text-neutral-950">{definition.title}</span>
      <span className="mt-1 block text-sm leading-5 text-neutral-600">{definition.description}</span>
      <span className="mt-3 block border-t border-black/5 pt-3 text-xs leading-5 text-neutral-500">
        예: {definition.example}
      </span>
    </label>
  );
}

function SlotMiniature({ slot }: { slot: OnboardingAdSlot }) {
  const isVideo = slot === "youtube_video_mention" || slot === "instagram_reel_mention";
  const isInstagram = slot.startsWith("instagram");
  return (
    <span aria-hidden="true" className="block h-14 rounded-xl bg-white/90 p-2.5 shadow-sm ring-1 ring-black/5">
      {isVideo ? (
        <span className="flex h-full items-end gap-1.5">
          <span className={`block h-full rounded-md bg-neutral-200 ${isInstagram ? "w-7" : "w-12"}`} />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-1.5 w-4/5 rounded bg-neutral-200" />
            <span className="h-1.5 w-1/2 rounded bg-neutral-200" />
            <span className="mt-auto h-1.5 rounded bg-neutral-100">
              <span className="block h-full w-1/3 rounded bg-[var(--brand-primary)]" />
            </span>
          </span>
        </span>
      ) : (
        <span className="flex h-full flex-col justify-center gap-2">
          <span className="h-1.5 w-2/5 rounded bg-neutral-200" />
          <span className="h-2 rounded bg-[var(--brand-soft)] ring-1 ring-[var(--brand-border)]" />
          <span className="h-1.5 w-3/4 rounded bg-neutral-200" />
        </span>
      )}
    </span>
  );
}

function ChoiceField({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-semibold text-neutral-950">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium ${
              option.value === value
                ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                : "border-neutral-200 bg-white text-neutral-700"
            }`}
            key={option.value}
          >
            <input
              checked={option.value === value}
              className="sr-only"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ToggleChoice({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      aria-pressed={checked}
      className={`min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-medium ${
        checked
          ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
          : "border-neutral-200 bg-white text-neutral-700"
      }`}
      onClick={onChange}
      type="button"
    >
      {label}
    </button>
  );
}

function PriceChoice({
  error,
  options,
  value,
  onChange,
}: {
  error?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const isPreset = options.includes(value);
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-neutral-950">이 광고 자리의 희망 가격은 얼마인가요?</legend>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <ToggleChoice
            checked={value === option}
            key={option}
            label={`${option}만원`}
            onChange={() => onChange(option)}
          />
        ))}
        <ToggleChoice checked={!isPreset} label="직접 입력" onChange={() => onChange("")} />
      </div>
      {!isPreset ? (
        <div className="mt-3">
          <ManwonField
            description="0.5만원부터 99만원까지 입력할 수 있어요."
            error={error}
            label="희망 가격 직접 입력"
            name="placementFeeManwon"
            onChange={onChange}
            value={value}
          />
        </div>
      ) : (
        <input name="placementFeeManwon" type="hidden" value={value} />
      )}
      {isPreset ? <FieldError message={error} /> : null}
    </fieldset>
  );
}

function TextField({
  description,
  error,
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  description?: string;
  error?: string;
  inputMode?: "numeric";
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-950" htmlFor={name}>{label}</label>
      <input
        className="brand-focus mt-2 min-h-12 w-full rounded-xl border border-neutral-300 px-4 text-base outline-none"
        id={name}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {description ? <p className="mt-1.5 text-xs text-neutral-500">{description}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

function TextArea({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-950" htmlFor="bio">{label}</label>
      <textarea
        className="brand-focus mt-2 min-h-24 w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none"
        id="bio"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function ManwonField({ description, error, label, name, onChange, value }: { description: string; error?: string; label: string; name: string; onChange: (value: string) => void; value: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-950" htmlFor={name}>{label}</label>
      <div className="mt-2 flex min-h-12 rounded-xl border border-neutral-300 bg-white focus-within:border-[var(--brand-primary)]">
        <input
          className="min-w-0 flex-1 rounded-l-xl px-4 text-base outline-none"
          id={name}
          inputMode="decimal"
          name={name}
          onChange={(event) => onChange(event.target.value)}
          type="text"
          value={value}
        />
        <span className="flex items-center border-l border-neutral-200 px-4 text-sm text-neutral-500">만원</span>
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">{description}</p>
      <FieldError message={error} />
    </div>
  );
}

function ImageField({ error, fileInputRef, onChange, onClear, previewUrl }: { error?: string | null; fileInputRef: React.RefObject<HTMLInputElement | null>; onChange: (file: File | undefined) => Promise<void>; onClear: () => void; previewUrl: string | null }) {
  return (
    <div className="border-t border-neutral-200 pt-5">
      <label className="text-sm font-semibold text-neutral-950" htmlFor="coverImage">대표 이미지 (선택)</label>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        대표 이미지는 없어도 신청할 수 있습니다. 공개 전 확인 과정에서 추가할 수 있어요.
      </p>
      <input
        accept={allowedImageMimeTypes.join(",")}
        className="mt-3 block w-full text-sm"
        id="coverImage"
        name="coverImage"
        onChange={(event) => void onChange(event.target.files?.[0])}
        ref={fileInputRef}
        type="file"
      />
      {previewUrl ? (
        <div className="mt-3 w-32 rounded-xl border border-neutral-200 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="대표 이미지 미리보기" className="aspect-[4/5] w-full rounded-lg object-cover" src={previewUrl} />
          <button className="mt-2 text-xs text-red-700" onClick={onClear} type="button">이미지 삭제</button>
        </div>
      ) : null}
      <FieldError message={error} />
    </div>
  );
}

function OnboardingPreview({ adSlot, channelName, maintenanceDays, mentionSeconds, optionKeys, placementFeeKrw, productionFeeKrw, totalPrice, turnaroundDays }: { adSlot: OnboardingAdSlot; channelName: string; maintenanceDays: string; mentionSeconds: string; optionKeys: OnboardingOptionKey[]; placementFeeKrw: number; productionFeeKrw: number; totalPrice: number; turnaroundDays: string }) {
  const definition = getOnboardingAdSlotDefinition(adSlot);
  const presentation = getOnboardingSlotPresentation({
    adSlot,
    mentionSeconds: Number(mentionSeconds) as 15 | 30 | 60,
    optionKeys,
    maintenanceDays: definition.inventoryType === "existing_traffic" ? Number(maintenanceDays) : null,
    turnaroundDays: definition.inventoryType === "new_content" ? Number(turnaroundDays) as 7 | 14 | 30 : null,
  });
  return (
    <section className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-5">
      <p className="text-xs font-semibold text-[var(--brand-ink)]">내가 등록할 광고 자리</p>
      <h2 className="mt-2 text-lg font-semibold text-neutral-950">{presentation.title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{channelName || "채널명"}</p>
      <dl className="mt-5 grid gap-3 border-t border-black/5 pt-4 text-sm sm:grid-cols-2">
        {adSlot === "youtube_video_mention" ? <PreviewItem label="소개 시간" value={`${mentionSeconds}초`} /> : null}
        {definition.inventoryType === "new_content" ? <PreviewItem label="제작 기간" value={`${turnaroundDays}일 이내`} /> : <PreviewItem label="유지 기간" value={`${maintenanceDays}일`} />}
        <PreviewItem label="희망 가격" value={formatKrw(placementFeeKrw)} />
        {productionFeeKrw > 0 ? <PreviewItem label="제작비" value={formatKrw(productionFeeKrw)} /> : null}
        <PreviewItem label="예상 총액" value={formatKrw(totalPrice)} />
      </dl>
    </section>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-neutral-500">{label}</dt><dd className="mt-0.5 font-medium text-neutral-900">{value}</dd></div>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="brand-primary ml-auto min-h-12 rounded-xl border px-6 text-sm font-semibold disabled:cursor-not-allowed" disabled={pending} type="submit">
      {pending ? "등록 신청 중" : "광고 자리 등록 신청하기"}
    </button>
  );
}

function FieldError({ message }: { message?: string | null }) {
  return message ? <p className="mt-2 text-sm text-red-700" role="alert">{message}</p> : null;
}

function manwonToKrw(value: string) {
  const number = Number(value);
  const krw = number * 10_000;
  return Number.isFinite(number) && Number.isSafeInteger(krw) && number >= 0 ? krw : 0;
}

function formatKrw(value: number) {
  if (value > 0 && value % 10_000 === 0) {
    return `${new Intl.NumberFormat("ko-KR").format(value / 10_000)}만원`;
  }
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function readDraftFromSession() {
  try {
    return readCreatorOnboardingDraft(window.sessionStorage);
  } catch {
    return null;
  }
}

function writeDraftToSession(draft: CreatorOnboardingDraft) {
  try {
    return writeCreatorOnboardingDraft(window.sessionStorage, draft);
  } catch {
    return false;
  }
}

async function resizeImage(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxImageSide / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, file.type, file.type === "image/png" ? undefined : 0.86);
  });
  return blob ? new File([blob], file.name, { type: file.type }) : file;
}
