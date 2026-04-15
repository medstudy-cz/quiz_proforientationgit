"use client"
import React, {useEffect, useState} from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalContent, ModalFooter,
    useDisclosure
} from "@nextui-org/react";
import Image from "next/image";
import done from "@/public/done.svg";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import clsx from "clsx";
import uniPic from "@/public/orientationPic.svg"
import {useMotionValueEvent, useScroll} from "framer-motion";

type ThankYouPageProps = {
    bundle: any
}
const ThankYouPage = ({bundle} : ThankYouPageProps) => {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    useEffect(() => {
        onOpen()
    },[onOpen])

    return (
        <Modal isOpen={isOpen} size={"3xl"}
               onOpenChange={onOpenChange}
               className={"md:pb-16 md:pt-14 md:px-20"}
        >
            <ModalContent>
                <ModalBody className={"w-full flex flex-col items-center py-10 "}>
                    <Image width={120} height={120} src={done} alt={"Form is send"}/>
                    <h1 className="text-center text-blue-950 text-lg sm:text-3xl font-bold relative sm:leading-10 sm:tracking-wide">
                        {bundle.heading}
                    </h1>
                    <p className={"text-center sm:text-xl"}>
                        {bundle.subheading}
                    </p>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

const PopUpOrientationUA = () => {
    const params = useSearchParams();
    const [isOpen, setOpen] = useState(false);

    const [triggered, setTriggered] = useState(false);

    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const {scrollY} = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
        if(latest >= 500 && !triggered) {
            setOpen(true);
            setTriggered(true);
        }
    });

    return (
        <Modal isOpen={isOpen} size={"3xl"}
               radius={"sm"}
               onOpenChange={() => setOpen(o => !o)}
               className={clsx([
                   "sm:pb-8 sm:px-8 md:pb-16",
               ])}
        >
            <ModalContent className={"bg-[#184C99] text-white max-w-[420px] sm:max-w-3xl relative"}>
                <Image
                    src={uniPic}
                    alt={"University pic on pop up"}
                    className={"hidden sm:block absolute bottom-1 right-1 md:bottom-7 md:right-7"}
                />
                <ModalBody className={"w-full flex flex-col py-[10%] sm:pt-[8%] md:pb-[5%]"}>
                    <h2 className="text-2xl pb-3 font-bold relative sm:leading-10 sm:tracking-wide max-w-[410px] sm:max-w-2xl">
                        Цікавишся безкоштовним навчанням у Чехії?
                        {/*{bundle.thanks.heading}*/}
                    </h2>
                    <p className={"text-xl font-normal max-w-[410px]"}>
                        Пройди тест з профорієнтації
                        <br></br>
                        та отримай безкоштовний
                        <br></br>
                        гайд про вступ до ВНЗ Чехії.
                        {/*{bundle.thanks.subheading}*/}
                    </p>
                </ModalBody>
                <ModalFooter className={"w-full sm:max-w-[350px]"}>
                    <Button variant={"solid"} color={"primary"} radius={"sm"}
                            isLoading={loading}
                            onClick={ () => {
                                setLoading(true)
                                router.push(`/orientation?${params}`)
                            }}
                            className={"w-full bg-[#36B5FF] px-6 py-7"}>
                        <h3 className={"font-bold text-lg"}>
                            Пройти тест
                        </h3>
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
type PopUpsProps = {
    modalForm: any
}
const PopUps = ({modalForm} : PopUpsProps) => {
    const params = useSearchParams();
    const pathname = usePathname();

    const isThankYouShown = () => params.get("thanks")  == "test"

    const isOrientationUaShown = () => !isThankYouShown() && pathname == "/ua"

    return (
        <>
            { isThankYouShown() && <ThankYouPage bundle={modalForm.thanks}/> }
            { isOrientationUaShown() && <PopUpOrientationUA/>}
        </>
    )

};

export default PopUps;