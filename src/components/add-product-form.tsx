"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

type ProcessingStep = "idle" | "uploading" | "saving" | "success";

const getFileExtension = (file: File) => {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (extensionFromName) {
    return extensionFromName === "jpg" ? "jpeg" : extensionFromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpeg";
};

export function AddProductForm() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");

  const isProcessing =
    processingStep === "uploading" || processingStep === "saving";

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setError(null);

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      setImageFile(null);
      setImagePreviewUrl(null);
      setError("กรุณาเลือกรูปภาพชนิด JPEG, PNG หรือ WEBP");
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!name.trim()) {
      return "กรุณากรอกชื่อสินค้า";
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return "ราคาต้องมากกว่า 0";
    }

    if (
      !Number.isInteger(parsedStock) ||
      parsedStock < 0 ||
      stock.trim() === ""
    ) {
      return "จำนวนสินค้าในสต๊อกต้องเป็น 0 หรือมากกว่า";
    }

    if (!imageFile) {
      return "กรุณาเลือกรูปสินค้า";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isProcessing) {
      return;
    }

    setError(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();

      setProcessingStep("saving");
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("id")
        .eq("name", "MiniShop")
        .limit(1)
        .maybeSingle();

      if (shopError) {
        throw new Error(shopError.message);
      }

      if (!shop?.id) {
        throw new Error("ไม่พบร้าน MiniShop ในฐานข้อมูล");
      }

      setProcessingStep("uploading");

      const file = imageFile as File;
      const extension = getFileExtension(file);
      const filename = `${shop.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filename);

      setProcessingStep("saving");

      const { error: insertError } = await supabase.from("products").insert({
        shop_id: shop.id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        image_url: publicUrl,
        stock: Number(stock),
        is_active: isActive,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setProcessingStep("success");
      router.push("/seller/products");
      router.refresh();
    } catch (caughtError) {
      setProcessingStep("idle");
      setError(
        caughtError instanceof Error ? caughtError.message : "เกิดข้อผิดพลาด",
      );
    }
  };

  const buttonLabel =
    processingStep === "uploading"
      ? "กำลังอัปโหลดรูป..."
      : processingStep === "saving"
        ? "กำลังบันทึกสินค้า..."
        : processingStep === "success"
          ? "เพิ่มสินค้าสำเร็จ"
          : "บันทึกสินค้า";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-100"
    >
      {error ? <ErrorState title="เกิดข้อผิดพลาด" message={error} /> : null}
      {processingStep === "success" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          เพิ่มสินค้าสำเร็จ
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-bold text-zinc-700">รูปสินค้า</span>
        <input
          className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-emerald-700 focus:border-emerald-500"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isProcessing}
          onChange={handleImageChange}
        />
      </label>

      {imagePreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagePreviewUrl}
          alt="ตัวอย่างรูปสินค้า"
          className="h-64 w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-emerald-50 text-sm font-bold text-emerald-700">
          ตัวอย่างรูปสินค้า
        </div>
      )}

      <label className="block">
        <span className="text-sm font-bold text-zinc-700">ชื่อสินค้า</span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 outline-none focus:border-emerald-500"
          placeholder="เช่น ชาเขียวมัทฉะเซ็ต"
          value={name}
          disabled={isProcessing}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-zinc-700">รายละเอียดสินค้า</span>
        <textarea
          className="mt-2 min-h-32 w-full rounded-2xl border border-zinc-200 p-4 outline-none focus:border-emerald-500"
          placeholder="เล่าให้ลูกค้ารู้ว่าสินค้านี้เหมาะกับใคร"
          value={description}
          disabled={isProcessing}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-zinc-700">ราคา</span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 outline-none focus:border-emerald-500"
          inputMode="decimal"
          placeholder="390"
          value={price}
          disabled={isProcessing}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-zinc-700">
          จำนวนสินค้าในสต๊อก
        </span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 outline-none focus:border-emerald-500"
          inputMode="numeric"
          placeholder="24"
          value={stock}
          disabled={isProcessing}
          onChange={(event) => setStock(event.target.value)}
        />
      </label>
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 p-4">
        <span>
          <span className="block text-sm font-bold text-zinc-700">
            สถานะเปิดขาย
          </span>
          <span className="mt-1 block text-xs text-zinc-500">
            เปิดไว้เพื่อให้สินค้าแสดงบนหน้าร้าน
          </span>
        </span>
        <input
          type="checkbox"
          className="size-5 accent-emerald-500"
          checked={isActive}
          disabled={isProcessing}
          onChange={(event) => setIsActive(event.target.checked)}
        />
      </label>
      <button
        className="h-12 w-full rounded-full bg-emerald-500 text-sm font-black text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
        type="submit"
        disabled={isProcessing}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
