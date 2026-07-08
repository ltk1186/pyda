"use client";

import { useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  allowedImageMimeTypes,
  maxListingImageBytes,
} from "@/lib/admin/listing-core";
import type { CreatorOnboardingFormState } from "@/app/creator/onboarding/actions";
import {
  applyRecommendedOnboardingPriceValues,
  calculateOnboardingTotalPrice,
  getAllowedOnboardingOptions,
  getOnboardingErrorStep,
  getOnboardingTemplate,
  inferOnboardingSelectedPlatform,
  onboardingMentionSeconds,
  onboardingOptionLabels,
  onboardingStoryCounts,
  onboardingTurnaroundDays,
  type OnboardingInventoryType,
  type OnboardingOptionKey,
  type OnboardingPlatform,
} from "@/lib/creator/onboarding-core";

type CreatorOnboardingFormProps = {
  action: (
    state: CreatorOnboardingFormState,
    formData: FormData,
  ) => Promise<CreatorOnboardingFormState>;
};

const initialState: CreatorOnboardingFormState = {};
const maxImageSide = 1600;

export function CreatorOnboardingForm({ action }: CreatorOnboardingFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstErrorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [youtubeName, setYoutubeName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeAudienceSize, setYoutubeAudienceSize] = useState("");
  const [instagramName, setInstagramName] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [instagramAudienceSize, setInstagramAudienceSize] = useState("");
  const [selectedPlatform, setSelectedPlatform] =
    useState<OnboardingPlatform>("YouTube");
  const [bio, setBio] = useState("");
  const [inventoryType, setInventoryType] =
    useState<OnboardingInventoryType>("new_content");
  const [optionKeys, setOptionKeys] = useState<OnboardingOptionKey[]>([]);
  const [placementFeeManwon, setPlacementFeeManwon] = useState("");
  const [productionFeeManwon, setProductionFeeManwon] = useState("");
  const [placementFeeTouched, setPlacementFeeTouched] = useState(false);
  const [productionFeeTouched, setProductionFeeTouched] = useState(false);
  const [turnaroundDays, setTurnaroundDays] = useState("14");
  const [maintenanceDays, setMaintenanceDays] = useState("14");
  const [mentionSeconds, setMentionSeconds] = useState("15");
  const [storyCount, setStoryCount] = useState("1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  const formAction = async (
    previousState: CreatorOnboardingFormState,
    formData: FormData,
  ) => {
    const result = await action(previousState, formData);

    if (result.errors) {
      setStep(getOnboardingErrorStep(result.errors));
      requestAnimationFrame(() => {
        firstErrorRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      });
    }

    return result;
  };
  const [state, submitAction] = useActionState(formAction, initialState);
  const template = useMemo(
    () => getOnboardingTemplate(selectedPlatform, inventoryType),
    [selectedPlatform, inventoryType],
  );
  const allowedOptions = useMemo(
    () => getAllowedOnboardingOptions({ platform: selectedPlatform, inventoryType }),
    [selectedPlatform, inventoryType],
  );
  const totalPrice = calculateOnboardingTotalPrice({
    placementFeeKrw: manwonToKrw(placementFeeManwon),
    productionFeeKrw:
      inventoryType === "new_content" ? manwonToKrw(productionFeeManwon) : 0,
  });

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
  }

  function clearImage() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
  }

  function toggleOption(optionKey: OnboardingOptionKey) {
    setOptionKeys((current) =>
      current.includes(optionKey)
        ? current.filter((key) => key !== optionKey)
        : [...current, optionKey],
    );
  }

  function changePlatform(nextPlatform: OnboardingPlatform) {
    setSelectedPlatform(nextPlatform);
    setOptionKeys((current) =>
      current.filter((optionKey) =>
        getAllowedOnboardingOptions({
          platform: nextPlatform,
          inventoryType,
        }).includes(optionKey),
      ),
    );

    if (step === 3) {
      applyRecommendedPrices(nextPlatform, inventoryType);
    }
  }

  function changeInventoryType(nextInventoryType: OnboardingInventoryType) {
    setInventoryType(nextInventoryType);
    setOptionKeys((current) =>
      current.filter((optionKey) =>
        getAllowedOnboardingOptions({
          platform: selectedPlatform,
          inventoryType: nextInventoryType,
        }).includes(optionKey),
      ),
    );

    if (step === 3) {
      applyRecommendedPrices(selectedPlatform, nextInventoryType);
    }
  }

  function applyRecommendedPrices(
    platform: OnboardingPlatform,
    nextInventoryType: OnboardingInventoryType,
  ) {
    const recommended = applyRecommendedOnboardingPriceValues({
      currentPlacementFeeManwon: placementFeeManwon,
      currentProductionFeeManwon: productionFeeManwon,
      placementFeeTouched,
      productionFeeTouched,
      platform,
      inventoryType: nextInventoryType,
    });

    setPlacementFeeManwon(recommended.placementFeeManwon);
    setProductionFeeManwon(recommended.productionFeeManwon);
  }

  function goToNextStep() {
    if (step === 1) {
      const inferredPlatform = inferOnboardingSelectedPlatform({
        current: selectedPlatform,
        youtubeComplete: isCompleteChannel({
          name: youtubeName,
          url: youtubeUrl,
          audienceSize: youtubeAudienceSize,
        }),
        instagramComplete: isCompleteChannel({
          name: instagramName,
          url: instagramUrl,
          audienceSize: instagramAudienceSize,
        }),
      });

      if (inferredPlatform !== selectedPlatform) {
        changePlatform(inferredPlatform);
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      applyRecommendedPrices(selectedPlatform, inventoryType);
      setStep(3);
    }
  }

  return (
    <form action={submitAction} className="space-y-6">
      <StepNav step={step} />
      <div ref={firstErrorRef} />

      <section className={step === 1 ? "space-y-5" : "hidden"}>
        <SectionTitle
          title="어디에서 콘텐츠를 만들고 있나요?"
          description="운영하는 채널만 입력하세요. 하나만 있어도 되고, 두 개 모두 등록해도 됩니다."
        />
        <TextField
          error={state.errors?.displayName}
          label="활동명"
          name="displayName"
          onChange={setDisplayName}
          placeholder="제주한바퀴"
          value={displayName}
        />

        <ChannelCard title="YouTube">
          <TextField
            error={state.errors?.youtubeName}
            label="YouTube 채널명"
            name="youtubeName"
            onChange={setYoutubeName}
            value={youtubeName}
          />
          <TextField
            error={state.errors?.youtubeUrl}
            label="채널 주소"
            name="youtubeUrl"
            onChange={setYoutubeUrl}
            placeholder="https://youtube.com/@channel"
            value={youtubeUrl}
          />
          <TextField
            error={state.errors?.youtubeAudienceSize}
            inputMode="numeric"
            label="구독자 수"
            name="youtubeAudienceSize"
            onChange={setYoutubeAudienceSize}
            value={youtubeAudienceSize}
          />
        </ChannelCard>

        <ChannelCard title="Instagram">
          <TextField
            error={state.errors?.instagramName}
            label="Instagram 계정명"
            name="instagramName"
            onChange={setInstagramName}
            value={instagramName}
          />
          <TextField
            error={state.errors?.instagramUrl}
            label="계정 주소"
            name="instagramUrl"
            onChange={setInstagramUrl}
            placeholder="https://instagram.com/account"
            value={instagramUrl}
          />
          <TextField
            error={state.errors?.instagramAudienceSize}
            inputMode="numeric"
            label="팔로워 수"
            name="instagramAudienceSize"
            onChange={setInstagramAudienceSize}
            value={instagramAudienceSize}
          />
        </ChannelCard>

        <TextArea
          label="한 줄 소개"
          name="bio"
          onChange={setBio}
          placeholder="제주의 작은 가게와 여행지를 영상으로 소개합니다."
          value={bio}
        />
      </section>

      <section className={step === 2 ? "space-y-5" : "hidden"}>
        <SectionTitle
          title="어떤 방식으로 광고할 수 있나요?"
          description="영상 전체를 광고로 만들 필요는 없습니다. 지금 만드는 콘텐츠 안의 일부 자리나 이미 운영 중인 채널의 광고 자리도 팔 수 있습니다."
        />
        <ChoiceCards
          label="이번에 첫 광고 상품을 등록할 채널"
          name="selectedPlatform"
          onChange={(value) => changePlatform(value as OnboardingPlatform)}
          options={[
            { value: "YouTube", label: "YouTube" },
            { value: "Instagram", label: "Instagram" },
          ]}
          value={selectedPlatform}
        />
        <FieldError message={state.errors?.selectedPlatform} />

        <ChoiceCards
          label="광고 방식"
          name="inventoryType"
          onChange={(value) =>
            changeInventoryType(value as OnboardingInventoryType)
          }
          options={[
            {
              value: "new_content",
              label: "새 콘텐츠로 소개하기",
              description:
                "새 영상이나 릴스를 만들면서 브랜드, 매장 또는 상품을 직접 소개합니다.",
            },
            {
              value: "existing_traffic",
              label: "기존 콘텐츠나 계정에 광고 추가하기",
              description:
                "새 콘텐츠를 만들지 않고, 이미 보고 있는 사람들이 있는 곳에 광고를 추가합니다.",
            },
          ]}
          value={inventoryType}
        />

        <div className="rounded-lg border border-neutral-200 p-5">
          <p className="mb-3 text-sm font-medium text-neutral-950">
            예: {template.example}
          </p>
          <h3 className="text-lg font-semibold">{template.heading}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {template.description}
          </p>
          {template.baseDeliverables.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-medium">기본 실행 내용</p>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                {template.baseDeliverables.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {inventoryType === "existing_traffic" ? (
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              어떤 콘텐츠나 위치에 광고를 붙일지는 실제 요청이 들어오면 광고주와 함께 정합니다. 공개 전에는 최근에도 실제 반응이 있는지 확인할 수 있습니다.
            </p>
          ) : null}
        </div>

        {selectedPlatform === "YouTube" && inventoryType === "new_content" ? (
          <div>
            <label
              className="text-sm font-medium text-neutral-950"
              htmlFor="mentionSeconds"
            >
              직접 소개 시간
            </label>
            <select
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
              id="mentionSeconds"
              name="mentionSeconds"
              onChange={(event) => setMentionSeconds(event.target.value)}
              value={mentionSeconds}
            >
              {onboardingMentionSeconds.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds}초
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.mentionSeconds} />
          </div>
        ) : null}

        <div className="rounded-lg border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold">추가할 수 있는 내용</h3>
          <div className="mt-4 grid gap-2">
            {allowedOptions.map((optionKey) => (
              <label
                className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm"
                key={optionKey}
              >
                <input
                  checked={optionKeys.includes(optionKey)}
                  name="optionKeys"
                  onChange={() => toggleOption(optionKey)}
                  type="checkbox"
                  value={optionKey}
                />
                {onboardingOptionLabels[optionKey]}
              </label>
            ))}
          </div>
          <FieldError message={state.errors?.optionKeys} />
        </div>

        {selectedPlatform === "Instagram" &&
        inventoryType === "new_content" &&
        optionKeys.includes("story_3") ? (
          <div>
            <label
              className="text-sm font-medium text-neutral-950"
              htmlFor="storyCount"
            >
              스토리 몇 건을 추가할까요?
            </label>
            <select
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
              id="storyCount"
              name="storyCount"
              onChange={(event) => setStoryCount(event.target.value)}
              value={storyCount}
            >
              {onboardingStoryCounts.map((count) => (
                <option key={count} value={count}>
                  {count}건
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.storyCount} />
          </div>
        ) : null}
      </section>

      <section className={step === 3 ? "space-y-5" : "hidden"}>
        <SectionTitle title="가격과 조건을 정해주세요" />
        <ManwonField
          description="내 콘텐츠와 채널의 광고 가치를 정하는 금액입니다."
          error={state.errors?.placementFeeManwon}
          label="광고 자리값"
          name="placementFeeManwon"
          onChange={(value) => {
            setPlacementFeeTouched(true);
            setPlacementFeeManwon(value);
          }}
          value={placementFeeManwon}
        />
        {inventoryType === "new_content" ? (
          <>
            <ManwonField
              description="방문, 촬영, 편집처럼 새 콘텐츠를 만드는 데 드는 비용입니다."
              error={state.errors?.productionFeeManwon}
              label="제작비"
              name="productionFeeManwon"
              onChange={(value) => {
                setProductionFeeTouched(true);
                setProductionFeeManwon(value);
              }}
              value={productionFeeManwon}
            />
            <div>
              <label
                className="text-sm font-medium text-neutral-950"
                htmlFor="turnaroundDays"
              >
                보통 언제까지 제작할 수 있나요?
              </label>
              <select
                className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
                id="turnaroundDays"
                name="turnaroundDays"
                onChange={(event) => setTurnaroundDays(event.target.value)}
                value={turnaroundDays}
              >
                {onboardingTurnaroundDays.map((days) => (
                  <option key={days} value={days}>
                    {days}일 이내
                  </option>
                ))}
              </select>
              <FieldError message={state.errors?.turnaroundDays} />
            </div>
          </>
        ) : (
          <>
            <input name="productionFeeManwon" type="hidden" value="0" />
            <TextField
              error={state.errors?.maintenanceDays}
              inputMode="numeric"
              label="얼마 동안 광고를 유지할까요?"
              name="maintenanceDays"
              onChange={setMaintenanceDays}
              value={maintenanceDays}
            />
            <div className="flex flex-wrap gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
                  key={days}
                  onClick={() => setMaintenanceDays(`${days}`)}
                  type="button"
                >
                  {days}일
                </button>
              ))}
            </div>
          </>
        )}

        <p className="text-sm leading-6 text-neutral-600">
          처음 정하는 희망 가격입니다. 실제 광고 내용과 조건에 따라 광고주와 조율할 수 있습니다.
        </p>

        <div>
          <label className="text-sm font-medium text-neutral-950" htmlFor="coverImage">
            대표 이미지
          </label>
          <p className="mt-1 text-xs text-neutral-500">
            없어도 등록을 신청할 수 있습니다. 공개 전 확인 과정에서 추가할 수 있습니다.
          </p>
          <input
            accept={allowedImageMimeTypes.join(",")}
            className="mt-3 block w-full text-sm"
            id="coverImage"
            name="coverImage"
            onChange={(event) => {
              void handleImage(event.target.files?.[0]);
            }}
            ref={fileInputRef}
            type="file"
          />
          {previewUrl ? (
            <div className="mt-3 max-w-40 rounded-lg border border-neutral-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="대표 이미지 미리보기"
                className="aspect-[4/5] w-full rounded-md object-cover"
                src={previewUrl}
              />
              <button
                className="mt-2 text-xs text-red-700"
                onClick={clearImage}
                type="button"
              >
                이미지 삭제
              </button>
            </div>
          ) : null}
          <FieldError message={imageMessage ?? state.errors?.image} />
        </div>

        <Preview
          displayName={displayName}
          inventoryType={inventoryType}
          maintenanceDays={maintenanceDays}
          mentionSeconds={mentionSeconds}
          optionKeys={optionKeys}
          placementFeeKrw={manwonToKrw(placementFeeManwon)}
          platform={selectedPlatform}
          productionFeeKrw={
            inventoryType === "new_content" ? manwonToKrw(productionFeeManwon) : 0
          }
          storyCount={storyCount}
          template={template}
          totalPrice={totalPrice}
          turnaroundDays={turnaroundDays}
        />
      </section>

      <div>
        {state.message ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="status">
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <button
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            type="button"
          >
            이전
          </button>
        ) : null}
        {step < 3 ? (
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            onClick={goToNextStep}
            type="button"
          >
            다음
          </button>
        ) : (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}

function StepNav({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-neutral-600">
      {["내 채널", "광고 상품", "가격과 확인"].map((label, index) => (
        <div
          className={`rounded-full px-3 py-2 text-center ${
            step === index + 1
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
          key={label}
        >
          {index + 1}. {label}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}

function ChannelCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{children}</div>
    </section>
  );
}

function ChoiceCards({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-neutral-950">{label}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            className={`cursor-pointer rounded-lg border p-4 ${
              option.value === value
                ? "border-neutral-950 bg-neutral-50"
                : "border-neutral-200"
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
            <span className="font-medium">{option.label}</span>
            {option.description ? (
              <span className="mt-2 block text-sm leading-6 text-neutral-600">
                {option.description}
              </span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ManwonField({
  description,
  error,
  label,
  name,
  onChange,
  value,
}: {
  description: string;
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      <div className="mt-2 flex rounded-md border border-neutral-300 focus-within:border-neutral-950">
        <input
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          id={name}
          inputMode="decimal"
          name={name}
          onChange={(event) => onChange(event.target.value)}
          type="text"
          value={value}
        />
        <span className="border-l border-neutral-200 px-3 py-2 text-sm text-neutral-500">
          만원
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{description}</p>
      {value ? (
        <p className="mt-1 text-xs text-neutral-600">{value}만원</p>
      ) : null}
      <FieldError message={error} />
    </div>
  );
}

function TextField({
  error,
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
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
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
        id={name}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <FieldError message={error} />
    </div>
  );
}

function TextArea({
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      <textarea
        className="mt-2 min-h-20 w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
        id={name}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function Preview({
  displayName,
  inventoryType,
  maintenanceDays,
  mentionSeconds,
  optionKeys,
  placementFeeKrw,
  platform,
  productionFeeKrw,
  storyCount,
  template,
  totalPrice,
  turnaroundDays,
}: {
  displayName: string;
  inventoryType: OnboardingInventoryType;
  maintenanceDays: string;
  mentionSeconds: string;
  optionKeys: OnboardingOptionKey[];
  placementFeeKrw: number;
  platform: OnboardingPlatform;
  productionFeeKrw: number;
  storyCount: string;
  template: ReturnType<typeof getOnboardingTemplate>;
  totalPrice: number;
  turnaroundDays: string;
}) {
  const deliverables = [...template.baseDeliverables];

  if (platform === "YouTube" && inventoryType === "new_content") {
    deliverables[0] = `영상 안에서 약 ${mentionSeconds}초 직접 소개`;
  }

  for (const optionKey of optionKeys) {
    if (optionKey === "story_3") {
      deliverables.push(`스토리 ${storyCount}건 추가`);
      continue;
    }

    deliverables.push(onboardingOptionLabels[optionKey]);
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
      <h3 className="text-base font-semibold">마지막 미리보기</h3>
      <div className="mt-4 space-y-4 text-sm leading-6">
        <p className="font-medium text-neutral-950">
          {displayName || "활동명"}
        </p>
        <p>{platform}</p>
        <p className="font-medium text-neutral-950">{template.heading}</p>
        <div>
          <p className="font-medium">실행되는 내용</p>
          <ul className="mt-1 space-y-1">
            {deliverables.map((deliverable) => (
              <li key={deliverable}>✓ {deliverable}</li>
            ))}
          </ul>
        </div>
        {inventoryType === "new_content" ? (
          <p>제작 기간 {turnaroundDays}일 이내</p>
        ) : (
          <p>유지 기간 {maintenanceDays}일</p>
        )}
        <div className="space-y-1">
          <p>광고 자리값 {formatKrw(placementFeeKrw)}</p>
          {inventoryType === "new_content" ? (
            <p>제작비 {formatKrw(productionFeeKrw)}</p>
          ) : null}
          <p className="font-semibold text-neutral-950">
            광고주가 보는 총가격 {formatKrw(totalPrice)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        제출 후 채널과 광고 상품을 확인한 뒤 공개됩니다.
      </p>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "등록 신청 중" : "등록 신청하기"}
    </button>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-700" role="alert">
      {message}
    </p>
  );
}

function manwonToKrw(value: string) {
  const number = Number(value);
  const krw = number * 10_000;
  return Number.isFinite(number) && Number.isSafeInteger(krw) && number >= 0
    ? krw
    : 0;
}

function formatKrw(value: number) {
  if (value > 0 && value % 10_000 === 0) {
    return `${new Intl.NumberFormat("ko-KR").format(value / 10_000)}만원`;
  }

  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function isCompleteChannel(input: {
  name: string;
  url: string;
  audienceSize: string;
}) {
  return Boolean(
    input.name.trim() && input.url.trim() && input.audienceSize.trim(),
  );
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
