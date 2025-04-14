import React from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Tooltip } from "@heroui/react";
import { IoMdBrowsers } from "react-icons/io";
import { FaApple, FaWindows } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

interface Device {
  id: string;
  name: string;
  browser: string;
  loginDate: string;
  isCurrentDevice: boolean;
}

export default function DeviceHistory() {
  const [devices, setDevices] = React.useState<Device[]>([
    {
      id: "1",
      name: "MacBook Pro",
      browser: "Chrome",
      loginDate: "2024-02-20 10:30:00",
      isCurrentDevice: true
    },
    {
      id: "2",
      name: "iPhone 14",
      browser: "Safari",
      loginDate: "2024-02-19 15:45:00",
      isCurrentDevice: false
    },
    {
      id: "3",
      name: "Windows PC",
      browser: "Firefox",
      loginDate: "2024-02-18 09:15:00",
      isCurrentDevice: false
    }
  ]);

  const handleLogout = (deviceId: string) => {
    setDevices(devices.filter(device => device.id !== deviceId));
  };

  return (
    <Table aria-label="Device login history">
      <TableHeader>
        <TableColumn>DEVICE</TableColumn>
        <TableColumn>BROWSER</TableColumn>
        <TableColumn>LOGIN DATE</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {device.name.toLowerCase().includes("mac") || device.name.toLowerCase().includes("iphone") ? (
                  <FaApple size={22}/>
                ) : (
                  <FaWindows size={22} />
                )}
                <span>{device.name}</span>
                {device.isCurrentDevice && (
                  <span className="text-xs text-primary-500">(Current)</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <IoMdBrowsers size={22} />
                {device.browser}
              </div>
            </TableCell>
            <TableCell>{device.loginDate}</TableCell>
            <TableCell>
              <Tooltip content={device.isCurrentDevice ? "Current session" : "Logout device"}>
                <Button
                  isIconOnly
                  variant="light"
                  color={device.isCurrentDevice ? "default" : "danger"}
                  isDisabled={device.isCurrentDevice}
                  onPress={() => handleLogout(device.id)}
                >
                  <FiLogOut size={22} />
                </Button>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}