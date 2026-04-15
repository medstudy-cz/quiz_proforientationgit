"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import * as pixel from "@/integrations/fbpixel";

type FacebookPixelProps = {
    ids: string[]
}

const FacebookPixel = ({ids} : FacebookPixelProps) => {
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (!loaded) return;

        if(pathname == "/ua/webinar"){
           pixel.pageview("webinar")
            return;
        }

        if(pathname.endsWith("web2")) {
            pixel.pageview("web2")
            return;
        }

        if(pathname == "/ua/orientation") {
            pixel.pageview("orientation")
        } else {
            pixel.pageview("landing")
        }

    }, [pathname, loaded]);

    return (
        <div>
            <Script
                id="fb-pixel"
                src="/fb.js"
                strategy="afterInteractive"
                onLoad={() => {
                    setLoaded(true)
                }}
                data-pixel-ids={ids}
            />
        </div>
    );
};

export default FacebookPixel;