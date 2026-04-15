"use client"

import {Input} from "@nextui-org/input";
import {Checkbox, CircularProgress, Spacer} from "@nextui-org/react";
import {CountrySelector, usePhoneInput} from "react-international-phone";
import {Button} from "@nextui-org/button";
import React, {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

type RequestState = {
    state: "init" | "pending" | "error" | "done",
    message?: string,
}
type BuildInFormProps = {
    bundle: any
}
const BuildInForm = ({bundle} : BuildInFormProps) => {

    const router = useRouter();
    const params = useSearchParams();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [request, setRequest] = useState<RequestState>({state: "init"});
    const [isAccepted, setIsAccepted] = useState(true)

    const phoneInput = usePhoneInput({
        defaultCountry: "ua",
        value: phone,
        onChange: (data) => {
            setPhone(data.phone);
        }
    });






    return (
        <div className={"w-full max-w-md lg:max-w-lg flex flex-col items-center"}>


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
    );
};

export default BuildInForm;