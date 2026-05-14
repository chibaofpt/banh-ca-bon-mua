"use client";

import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/src/utils/cn";

const dailySchema = z.object({
  category: z.literal("daily"),
  sizes: z.object({
    M: z.number({ message: "Vui lòng nhập giá" }).int().min(0),
    L: z.number({ message: "Vui lòng nhập giá" }).int().min(0),
    XL: z.number({ message: "Vui lòng nhập giá" }).int().min(0),
  }),
});

const nonDailySchema = z.object({
  category: z.enum(["seasonal", "recipe"]),
  price_vnd: z.number({ message: "Vui lòng nhập giá" }).int().min(0),
});

const baseSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên món"),
  description: z.string().optional(),
  is_available: z.boolean(),
  image: z.custom<FileList | File | null>().optional(),
});

const schema = z.discriminatedUnion("category", [dailySchema, nonDailySchema]).and(baseSchema);

type FormValues = z.infer<typeof schema>;
type DailyFormValues = z.infer<typeof dailySchema> & z.infer<typeof baseSchema>;
type NonDailyFormValues = z.infer<typeof nonDailySchema> & z.infer<typeof baseSchema>;

interface MenuItemFormProps {
  onSubmit: (fd: FormData) => Promise<void>;
  isSubmitting: boolean;
}

/** Form component cho việc tạo/sửa menu item. */
export default function MenuItemForm({ onSubmit, isSubmitting }: MenuItemFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "daily",
      is_available: true,
    },
  });

  const category = watch("category");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (category === "daily") {
      resetField("price_vnd");
    } else {
      resetField("sizes.M");
      resetField("sizes.L");
      resetField("sizes.XL");
    }
  }, [category, resetField]);

  const onFormSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.append("name", values.name);
    if (values.description) fd.append("description", values.description);
    fd.append("category", values.category);
    fd.append("is_available", String(values.is_available));

    if (values.category === "daily") {
      fd.append(
        "sizes",
        JSON.stringify([
          { size: "M", price_vnd: values.sizes.M * 1000 },
          { size: "L", price_vnd: values.sizes.L * 1000 },
          { size: "XL", price_vnd: values.sizes.XL * 1000 },
        ])
      );
    } else {
      fd.append("price_vnd", String(values.price_vnd * 1000));
    }

    // Handle image file (RHF returns FileList for file inputs)
    if (values.image) {
      let file: File | null = null;
      if (values.image instanceof FileList && values.image.length > 0) {
        file = values.image[0];
      } else if (values.image instanceof File) {
        file = values.image;
      }
      
      if (file) {
        fd.append("image", file);
      }
    }

    await onSubmit(fd);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const inputClass = "rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tên món</label>
        <input
          {...register("name")}
          placeholder="Ví dụ: Matcha Latte"
          className={inputClass}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Mô tả</label>
        <textarea
          {...register("description")}
          placeholder="Mô tả ngắn về món"
          className={cn(inputClass, "min-h-[60px] resize-none")}
        />
        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Danh mục</label>
        <select {...register("category")} className={inputClass}>
          <option value="daily">daily</option>
          <option value="seasonal">seasonal</option>
          <option value="recipe">recipe</option>
        </select>
        {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
      </div>

      {category === "daily" ? (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground">Size M (cá 🐟)</label>
            <input
              type="number"
              {...register("sizes.M", { valueAsNumber: true })}
              placeholder="0"
              className={inputClass}
            />
            {(errors as FieldErrors<DailyFormValues>).sizes?.M && (
              <p className="text-xs text-destructive mt-1">
                {(errors as FieldErrors<DailyFormValues>).sizes?.M?.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Size L (cá 🐟)</label>
            <input
              type="number"
              {...register("sizes.L", { valueAsNumber: true })}
              placeholder="0"
              className={inputClass}
            />
            {(errors as FieldErrors<DailyFormValues>).sizes?.L && (
              <p className="text-xs text-destructive mt-1">
                {(errors as FieldErrors<DailyFormValues>).sizes?.L?.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Size XL (cá 🐟)</label>
            <input
              type="number"
              {...register("sizes.XL", { valueAsNumber: true })}
              placeholder="0"
              className={inputClass}
            />
            {(errors as FieldErrors<DailyFormValues>).sizes?.XL && (
              <p className="text-xs text-destructive mt-1">
                {(errors as FieldErrors<DailyFormValues>).sizes?.XL?.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-foreground">Giá (cá 🐟)</label>
          <input
            type="number"
            {...register("price_vnd", { valueAsNumber: true })}
            placeholder="0"
            className={inputClass}
          />
          {(errors as FieldErrors<NonDailyFormValues>).price_vnd && (
            <p className="text-xs text-destructive mt-1">
              {(errors as FieldErrors<NonDailyFormValues>).price_vnd?.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground">Ảnh sản phẩm</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-secondary/40 file:text-sm file:font-medium hover:file:bg-secondary/60"
          {...register("image", {
            onChange: handleImageChange,
          })}
        />
        {errors.image && <p className="text-xs text-destructive mt-1">{errors.image.message as string}</p>}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 h-20 w-20 rounded-xl object-cover border border-border"
          />
        )}
      </div>

      <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2">
        <label className="text-sm font-medium text-foreground">Trạng thái bán</label>
        <button
          type="button"
          role="switch"
          aria-checked={watch("is_available")}
          onClick={() => {
            const current = watch("is_available");
            resetField("is_available", { defaultValue: !current });
          }}
          className={cn(
            "relative inline-flex h-5 w-9 rounded-full transition",
            watch("is_available") ? "bg-primary" : "bg-border"
          )}
        >
          <span
            className={cn(
              "block h-4 w-4 rounded-full bg-white shadow transition-transform m-0.5",
              watch("is_available") ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isSubmitting ? "Đang xử lý..." : "Thêm món"}
        </button>
      </div>
    </form>
  );
}
