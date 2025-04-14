"use client"

import React from "react";
import { Tabs, Tab, Card } from "@heroui/react";
import { Footer, NavBar, ProfileDetail } from "@/components";
import { DeviceHistory } from "@/components";

export default function App() {
  const [selected, setSelected] = React.useState("detail");

  const handleSelectionChange = (key: React.Key) => {
    setSelected(String(key)); // Convert key to string
  };

  return (
    <section>

      <NavBar />

      <div className="w-full max-w-[1024px] mx-auto p-4 md:p-6 space-y-4">
        <div className="w-full max-w-[1024px] mx-auto p-4 md:p-6 space-y-4">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <Card>
            <Tabs
              selectedKey={selected}
              onSelectionChange={handleSelectionChange}
              aria-label="Profile settings"
              variant="underlined"
              color="primary"
              classNames={{
                tabList: "px-4 pt-4",
                panel: "p-4",
              }}
            >
              <Tab key="detail" title="Detail">
                <ProfileDetail />
              </Tab>
              <Tab key="devices" title="Devices">
                <DeviceHistory />
              </Tab>
            </Tabs>
          </Card>
        </div>
      </div>

      <Footer />
    </section>
  );
}