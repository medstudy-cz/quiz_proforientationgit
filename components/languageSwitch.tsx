"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select, SelectItem } from "@nextui-org/select";
import { acceptedLanguages } from "@/components/data";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

const LanguageSwitch = () => {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const [value, setValue] = useState(locale.toUpperCase());

    useEffect(() => {
        setValue(locale.toUpperCase());
    }, [locale]);

    const handleChange = (event: any) => {
        const selection = event.target.value.toLowerCase();
        if (!selection || selection === locale) return;

        setValue(selection.toUpperCase());

        // убираем текущую локаль из pathname и добавляем новую
        const segments = pathname.split("/").filter(Boolean); // ["ua", "page", ...]
        if (acceptedLanguages.includes(segments[0])) segments.shift(); // убираем текущую локаль

        const newPath = "/" + selection + "/" + segments.join("/");
        router.push(newPath);
        router.refresh();
    };

    return (
        <Select
            size="sm"
            radius="sm"
            variant="bordered"
            aria-label="Language selection"
            isRequired
            selectionMode="single"
            className="text-white mx-2"
            color="danger"
            classNames={{
                value: "text-white",
                description: "text-white",
                popoverContent: "text-white bg-[#153060]",
                selectorIcon: "w-7 h-7",
                trigger: "w-[74px] text-white bg-[#153060] hover:none border-none",
            }}
            selectedKeys={[value]}
            onChange={handleChange}
        >
            {acceptedLanguages.map((l) => (
                <SelectItem key={l.toUpperCase()} value={l.toUpperCase()} aria-label={l.toUpperCase()}>
                    {l.toUpperCase()}
                </SelectItem>
            ))}
        </Select>
    );
};

export default LanguageSwitch;
