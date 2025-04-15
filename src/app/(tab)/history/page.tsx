'use client'

import React from "react";
import { Footer, NavBar } from "@/components"
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { useTranslation } from "react-i18next";


export default function Page() {
    const [selected, setSelected] = React.useState("bangkachao");
    const { t } = useTranslation();
    const districtData: { [key: string]: { title: string; content: string } } = {
        bangkachao: {
            title: t('bkcTitle'),
            content: t('bkcHis')
        },
        songkanong: {
            title: t('sknTitle'),
            content: t('sknHis')
        },
        bangkasop: {
            title: t('bksTitle'),
            content: t('bksHis')
        },
        bangnamphueng: {
            title: t('bnpTitle'),
            content: t('bnpHis')
        },
        bangkobua: {
            title: t('bkbTitle'),
            content: t('bkbHis')
        },
        bangyor: {
            title: t('byTitle'),
            content: t('byHis')
        }
    };
    return (
        <div className="font-[family-name:var(--font-line-seed-sans)]">
            <NavBar />
            <div className="max-w-4xl mx-auto p-6 text-gray-800">
                <h1 className="text-3xl font-bold mb-4">{t('history')}</h1>
                <div className="mb-4 leading-7 space-y-4">
                    <p>
                    {t('bkcMain')}
                    </p>
                    <p>
                    {t('bkcMain2')}
                    </p>
                   
                </div>

                <h2 className="text-2xl font-semibold mt-8 mb-4">{t('hisTitle')}</h2>
                
                <Tabs aria-label="ตำบลในบางกะเจ้า"
                    selectedKey={selected}
                    onSelectionChange={(key) => setSelected(String(key))}>
                    {Object.entries(districtData).map(([key, { title, content }]) => (
                        <Tab key={key} title={title}>
                            <Card>
                                <CardBody className="leading-7 whitespace-pre-line">
                                    {content}
                                </CardBody>
                            </Card>
                        </Tab>
                    ))}
                </Tabs>
            </div>
            <Footer />
        </div>
    )
}