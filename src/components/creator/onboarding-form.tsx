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
  calculateOnboardingTotalPrice,
  getAllowedOnboardingOptions,
  getOnboardingTemplate,
  onboardingOptionLabels,
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
  const [state, formAction] = useActionState(action, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [platform, setPlatform] = useState<OnboardingPlatform>("YouTube");
  const [channelUrl, setChannelUrl] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [bio, setBio] = useState("");
  const [inventoryType, setInventoryType] =
    useState<OnboardingInventoryType>("new_content");
  const [optionKeys, setOptionKeys] = useState<OnboardingOptionKey[]>([]);
  const [placementFeeKrw, setPlacementFeeKrw] = useState("");
  const [productionFeeKrw, setProductionFeeKrw] = useState("");
  const [turnaroundDays, setTurnaroundDays] = useState("14");
  const [sourceContentUrl, setSourceContentUrl] = useState("");
  const [recent30dViews, setRecent30dViews] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  const template = useMemo(
    () => getOnboardingTemplate(platform, inventoryType),
    [platform, inventoryType],
  );
  const allowedOptions = useMemo(
    () => getAllowedOnboardingOptions({ platform, inventoryType }),
    [platform, inventoryType],
  );
  const totalPrice = calculateOnboardingTotalPrice({
    placementFeeKrw: numberValue(placementFeeKrw),
    productionFeeKrw:
      inventoryType === "new_content" ? numberValue(productionFeeKrw) : 0,
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
    setPlatform(nextPlatform);
    setOptionKeys((current) =>
      current.filter((optionKey) =>
        getAllowedOnboardingOptions({
          platform: nextPlatform,
          inventoryType,
        }).includes(optionKey),
      ),
    );
  }

  function changeInventoryType(nextInventoryType: OnboardingInventoryType) {
    setInventoryType(nextInventoryType);
    setOptionKeys((current) =>
      current.filter((optionKey) =>
        getAllowedOnboardingOptions({
          platform,
          inventoryType: nextInventoryType,
        }).includes(optionKey),
      ),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <StepNav step={step} />

      <section className={step === 1 ? "space-y-5" : "hidden"}>
        <SectionTitle
          title="어떤 콘텐츠를 만들고 있나요?"
          description="처음에는 채널 하나만 등록합니다."
        />
        <TextField
          error={state.errors?.displayName}
          label="활동명 또는 채널명"
          name="displayName"
          onChange={setDisplayName}
          placeholder="제주한바퀴"
          value={displayName}
        />
        <ChoiceCards
          label="주요 플랫폼"
          name="platform"
          onChange={(value) => changePlatform(value as OnboardingPlatform)}
          options={[
            { value: "YouTube", label: "YouTube" },
            { value: "Instagram", label: "Instagram" },
          ]}
          value={platform}
        />
        <TextField
          error={state.errors?.channelUrl}
          label="채널 주소"
          name="channelUrl"
          onChange={setChannelUrl}
          placeholder="https://youtube.com/@channel"
          value={channelUrl}
        />
        <TextField
          error={state.errors?.audienceSize}
          inputMode="numeric"
          label="구독자 또는 팔로워 수"
          name="audienceSize"
          onChange={setAudienceSize}
          value={audienceSize}
        />
        <TextArea
          label="채널 한 줄 소개"
          name="bio"
          onChange={setBio}
          placeholder="제주의 작은 가게와 여행지를 영상으로 소개합니다."
          value={bio}
        />
      </section>

      <section className={step === 2 ? "space-y-5" : "hidden"}>
        <SectionTitle title="무엇을 판매할까요?" />
        <ChoiceCards
          label="광고 상품"
          name="inventoryType"
          onChange={(value) =>
            changeInventoryType(value as OnboardingInventoryType)
          }
          options={[
            {
              value: "new_content",
              label: "새 콘텐츠에 광고 넣기",
              description:
                "새 영상이나 릴스를 만들면서 브랜드, 공간 또는 상품을 소개합니다.",
            },
            {
              value: "existing_traffic",
              label: "기존 콘텐츠에 광고 붙이기",
              description:
                "이미 사람들이 보고 있는 콘텐츠의 트래픽을 활용합니다.",
            },
          ]}
          value={inventoryType}
        />

        <div className="rounded-lg border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold">자동 결정된 광고 상품</h3>
          <p className="mt-2 font-medium">{template.title}</p>
          <p className="mt-1 text-sm text-neutral-600">{template.adFormat}</p>
        </div>

        <div className="rounded-lg border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold">
            이 가격에 무엇을 포함할까요?
          </h3>
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
      </section>

      <section className={step === 3 ? "space-y-5" : "hidden"}>
        <SectionTitle title="가격을 정해주세요" />
        <TextField
          error={state.errors?.placementFeeKrw}
          inputMode="numeric"
          label="광고 자리값"
          name="placementFeeKrw"
          onChange={setPlacementFeeKrw}
          value={placementFeeKrw}
        />
        {inventoryType === "new_content" ? (
          <>
            <TextField
              error={state.errors?.productionFeeKrw}
              inputMode="numeric"
              label="제작비"
              name="productionFeeKrw"
              onChange={setProductionFeeKrw}
              value={productionFeeKrw}
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
            <input name="productionFeeKrw" type="hidden" value="0" />
            <input name="maintenanceDays" type="hidden" value="30" />
            <TextField
              error={state.errors?.sourceContentUrl}
              label="광고를 붙일 기존 콘텐츠 주소"
              name="sourceContentUrl"
              onChange={setSourceContentUrl}
              value={sourceContentUrl}
            />
            <TextField
              error={state.errors?.recent30dViews}
              inputMode="numeric"
              label="최근 30일 조회수 또는 도달수"
              name="recent30dViews"
              onChange={setRecent30dViews}
              value={recent30dViews}
            />
            <p className="text-sm leading-6 text-neutral-600">
              누적 조회수보다 최근에도 실제로 사람들이 보고 있는지가 중요합니다.
            </p>
            <p className="rounded-md bg-neutral-50 px-3 py-2 text-sm">
              광고 유지 기간 30일
            </p>
          </>
        )}

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
          optionKeys={optionKeys}
          platform={platform}
          placementFeeKrw={numberValue(placementFeeKrw)}
          productionFeeKrw={
            inventoryType === "new_content" ? numberValue(productionFeeKrw) : 0
          }
          template={template}
          totalPrice={totalPrice}
          turnaroundDays={turnaroundDays}
        />
      </section>

      {state.message ? (
        <p className="text-sm text-red-700" role="status">
          {state.message}
        </p>
      ) : null}

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
            onClick={() => setStep((current) => Math.min(3, current + 1))}
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
  optionKeys,
  platform,
  placementFeeKrw,
  productionFeeKrw,
  template,
  totalPrice,
  turnaroundDays,
}: {
  displayName: string;
  inventoryType: OnboardingInventoryType;
  optionKeys: OnboardingOptionKey[];
  platform: OnboardingPlatform;
  placementFeeKrw: number;
  productionFeeKrw: number;
  template: ReturnType<typeof getOnboardingTemplate>;
  totalPrice: number;
  turnaroundDays: string;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
      <h3 className="text-base font-semibold">마지막 미리보기</h3>
      <div className="mt-4 space-y-3 text-sm leading-6">
        <p className="font-medium text-neutral-950">
          {displayName || "활동명"}
        </p>
        <p>
          {platform} ·{" "}
          {inventoryType === "new_content" ? "새 콘텐츠 광고" : "기존 콘텐츠 광고"}
        </p>
        <p className="font-medium text-neutral-950">{template.title}</p>
        <div>
          <p className="font-medium">포함 내용</p>
          <ul className="mt-1 space-y-1">
            {[...template.baseDeliverables, ...optionKeys.map((key) => onboardingOptionLabels[key])].map(
              (deliverable) => (
                <li key={deliverable}>✓ {deliverable}</li>
              ),
            )}
          </ul>
        </div>
        {inventoryType === "new_content" ? (
          <p>제작 기간 {turnaroundDays}일 이내</p>
        ) : (
          <p>광고 유지 기간 30일</p>
        )}
        <div>
          <p>광고 자리값 {formatKrw(placementFeeKrw)}</p>
          {inventoryType === "new_content" ? (
            <p>제작비 {formatKrw(productionFeeKrw)}</p>
          ) : null}
          <p className="mt-1 font-semibold text-neutral-950">
            총 {formatKrw(totalPrice)}
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

function numberValue(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
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
