"use client"
import React, {useState} from "react";
import {Button} from "@nextui-org/button";
import {Input} from "@nextui-org/input";
import {CountrySelector, usePhoneInput} from "react-international-phone";
import {Checkbox, CircularProgress, Spacer} from "@nextui-org/react";
import QuestionCard from "@/components/quiz/QuestionCard"
// import * as fbpixel from "@/integrations/fbpixel";
// import * as ttqpixel from "@/integrations/tiktokpixel";
import axios from "axios";
import {useRouter, useSearchParams} from "next/navigation";
import {analyticsMainFormSubmitReport} from "@/integrations/utils";
import {Card} from "@nextui-org/card";


type BoardTypes = {
    data: {
        id: number,
        question: string,
        answers: string[]
    }[],
    modal: {
        heading: string,
        fields: {
            first: string,
            second: string,
            third: string,
        }
        checkbox: string,
        button: string,
        thanks: {
            heading: string,
            subheading: string
        }
    }
}

type RequestState = {
    state: "init" | "pending" | "error" | "done",
    message?: string,

}

const Board = ({data, modal: bundle}: BoardTypes) => {
    const router = useRouter();
    const params = useSearchParams();
 
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [isAccepted, setIsAccepted] = useState(true);

    const [request, setRequest] = useState<RequestState>({state: "init"});

    const [activeIndex, setActiveIndex] = useState(0);

    const phoneInput = usePhoneInput({
        defaultCountry: "uk",
        value: phone,
        onChange: (data) => {
            setPhone(data.phone);
        }
    });

    function sendData(answers: { question: any, answer: any }[]) {
        setRequest({state: "pending"})


        axios.post("/api/lead", {
            name, phone, email,
            country: phoneInput.country,
            answers, utm: {
                source: params.get("utm_source"),
                medium: params.get("utm_medium"),
                campaign: params.get("utm_campaign"),
                content: params.get("utm_content"),
                term: params.get("utm_term"),
            }
        })
            .then((res) => {
                if (res.status == 200) {
                    analyticsMainFormSubmitReport("form_submit_orientation")

                    router.push("/uk?thanks=test")
                    // setRequest({state: "done"})
                } else {
                    setRequest({state: "error", message: res.data?.message})
                }
            })
            .catch(_ => {
                setRequest({state: "error", message: "Validation error. Please check that your info is correct."})
            })
    }

    return (
        <form
            className={"w-full px-6 container flex flex-col justify-center py-6 sm:pb-10 md:pb-16 max-w-xl lg:max-w-2xl"}
            onSubmit={(e) => {
                e.preventDefault();

                const elements = (e.target as HTMLFormElement).elements;
                const answers = [...elements]
                    .map(t => ({
                        question: t.getAttribute("x-question-id"),
                        answer: t.getAttribute("x-answer-id")
                    }))
                    .filter(t => t.question)

                sendData(answers)
            }}>

            <div className={"container flex flex-col items-center"}>

                <div className={"py-4"}>
                    {
                        data.map((cardData, i) => (
                            <QuestionCard
                                clickHandler={() => setActiveIndex(i => i + 1)}
                                outerWrapperClass={activeIndex == i ? "block" : "hidden"}
                                cardData={cardData} key={cardData.id}
                            />
                        ))
                    }
                </div>

                <Card shadow={"lg"} className={"p-4 sm:px-10 sm:py-8 md:pb-10 lg:pb-14 md:px-16 mb-4 sm:mb-10 md:mb-12" + ` ${data.length <= activeIndex ? "block" : "hidden"}`}>
                    <h1 className="py-3 text-center text-blue-950 text-lg sm:text-3xl font-bold relative sm:leading-10 sm:tracking-wide">
                        Отримати результат
                        {/*{bundle.thanks.heading}*/}
                    </h1>

                    <div
                        className={"w-full max-w-md lg:max-w-lg flex flex-col items-center"}>


                        <Input type={"text"}
                               size={"lg"}
                               label={bundle.fields.first}
                               variant={"bordered"}
                               placeholder={""}
                               value={name}
                               onChange={e => setName(e.target.value)}
                        />
                        <Spacer y={2}/>


                        <Input type={"tel"}
                               startContent={
                                   <CountrySelector
                                       className={"relative"}
                                       dropdownStyleProps={{
                                           className: "rounded-xl h-36 ",
                                           style: {zIndex: 20}
                                       }}
                                       buttonStyle={{border: "none"}}
                                       selectedCountry={phoneInput.country.iso2}
                                       onSelect={(country) => phoneInput.setCountry(country.iso2)}
                                   />
                               }
                               variant={"bordered"}
                               size={"lg"}
                               placeholder={bundle.fields.second}
                               value={phoneInput.phone}
                               onChange={phoneInput.handlePhoneValueChange}
                               ref={phoneInput.inputRef}
                        />

                        <Spacer y={2}/>

                        <Input type={"email"}
                               label={bundle.fields.third}
                               size={"lg"}
                               variant={"bordered"}
                               placeholder={""}
                               value={email}
                               onChange={e => setEmail(e.target.value)}
                        />
                        <Spacer y={2}/>


                        <div className={"w-full flex flex-col justify-center items-center"}>
                            <Checkbox isSelected={isAccepted} onValueChange={setIsAccepted}
                                      isRequired={true} color={"warning"}
                                      className={"py-3 md:py-8 flex items-center"}>
                                <p className={"text-xs md:text-medium text-gray-500" + (isAccepted ? "" : "text-xl")}>
                                    {bundle.checkbox}
                                </p>
                            </Checkbox>
                            <Spacer y={2}/>

                            {
                                request.state == "error" &&
                                <div className={"w-full p-3 bg-red-300 border-l-4 border-l-red-700"}>
                                    <p className={"font-semibold"}>{request.message}</p>
                                </div>
                            }


                            <Button type={"submit"} isDisabled={!isAccepted} variant={"solid"}
                                    color={"primary"}
                                    radius={"sm"}
                                    className={"w-full md:w-1/2 bg-[#36B5FF] px-6 py-7 "}>
                                {
                                    request.state == "pending" ?
                                        <CircularProgress aria-label={"Sending form"}/> :
                                        <h3 className={"font-bold text-lg"}>{bundle.button}</h3>
                                }
                            </Button>

                        </div>

                    </div>
                </Card>
            </div>
</form>
)
    ;
};

export default Board;