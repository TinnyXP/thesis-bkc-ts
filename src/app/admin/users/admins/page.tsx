"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Chip,
  Tooltip,
  CheckboxGroup,
  Checkbox,
  useDisclosure,
  Pagination,
  Card,
  CardBody,
  Divider,
  Spinner,
  Link
} from "@heroui/react";
import { FaUserShield, FaEdit, FaTrash, FaPlus, FaSearch, FaKey, FaUsers, FaArrowLeft, FaSyncAlt } from "react-icons/fa";
import { useAdmin, AdminUser } from "@/hooks/useAdmin";
import { Loading } from "@/components";
import { AdminSidebar } from "@/components";
import { showToast } from "@/lib/toast";

export default function AdminManagementListPage() {
  const router = useRouter();
  const { status } = useSession();
  const {
    isAdmin,
    isSuperAdmin,
    admins,
    isLoading,
    isLoadingAdmins,
    isProcessing,
    addAdmin,
    removeAdmin,
    setupSuperAdmin,
    getRoleText,
    getPermissionText,
    refreshAdmins
  } = useAdmin();

  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [newAdminId, setNewAdminId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["general"]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
    onOpenChange: onAddModalOpenChange
  } = useDisclosure();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();

  // ตรวจสอบสิทธิ์การเข้าถึงหน้านี้
  useEffect(() => {
    if (status === "authenticated" && !isLoading) {
      if (!isAdmin) {
        showToast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้", "error");
        router.push("/");
      } else if (!isSuperAdmin) {
        showToast("หน้านี้สำหรับ Super Admin เท่านั้น", "error");
        router.push("/admin");
      }
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, isAdmin, isSuperAdmin, isLoading, router]);

  // ค้นหาข้อมูล admin
  useEffect(() => {
    if (admins && admins.length > 0) {
      const results = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setPage(1); // รีเซ็ตหน้าเมื่อมีการค้นหาใหม่
    }
  }, [searchTerm, admins]);

  // คำนวณข้อมูลที่แสดงในตาราง
  const displayedAdmins = React.useMemo(() => {
    const results = searchTerm ? searchResults : admins;
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return results.slice(start, end);
  }, [page, rowsPerPage, searchTerm, searchResults, admins]);

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล admin
  const handleRefreshAdmins = async () => {
    setIsRefreshing(true);
    try {
      await refreshAdmins();
      showToast("รีเฟรชข้อมูลเรียบร้อย", "success");
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // จัดการการตั้งค่า Super Admin เริ่มต้น
  const handleSetupSuperAdmin = async () => {
    try {
      const result = await setupSuperAdmin();
      if (result.success) {
        showToast("ตั้งค่า Super Admin สำเร็จ", "success");
        refreshAdmins();
      }
    } catch (error) {
      console.error("Error setting up super admin:", error);
      showToast("เกิดข้อผิดพลาดในการตั้งค่า Super Admin", "error");
    }
  };

  // จัดการการเพิ่ม admin ใหม่
  const handleAddAdmin = async () => {
    if (!newAdminId.trim()) {
      showToast("กรุณากรอก BKC ID ของผู้ใช้", "error");
      return;
    }

    try {
      const result = await addAdmin(newAdminId, selectedPermissions);
      if (result.success) {
        showToast(`เพิ่ม ${result.admin?.name || "ผู้ใช้"} เป็น admin สำเร็จ`, "success");
        setNewAdminId("");
        setSelectedPermissions(["general"]);
        onAddModalClose();
        refreshAdmins();
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      showToast("เกิดข้อผิดพลาดในการเพิ่ม admin", "error");
    }
  };

  // จัดการการลบสิทธิ์ admin
  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const result = await removeAdmin(selectedAdmin.id);
      if (result.success) {
        // ปรับปรุงข้อความให้ชัดเจนว่าเราเพียงแค่ลบสิทธิ์ admin
        showToast(`ลบสิทธิ์ผู้ดูแลระบบของ ${selectedAdmin.name} สำเร็จ บัญชียังคงอยู่ในฐานะผู้ใช้ทั่วไป`, "success");
        setSelectedAdmin(null);
        onDeleteModalClose();

        // รีเฟรชข้อมูล admin ในหน้าจอ
        await refreshAdmins();
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      showToast("เกิดข้อผิดพลาดในการลบสิทธิ์ผู้ดูแลระบบ", "error");
    }
  };

  // ตรวจสอบว่าเป็น Super Admin หลักหรือไม่
  const isMainSuperAdmin = (admin: AdminUser): boolean => {
    return admin.role === 'superadmin' && admin.email === 'thesis.bangkachao.64@gmail.com';
  };

  // Pagination
  const pages = Math.ceil((searchTerm ? searchResults.length : admins.length) / rowsPerPage);

  if (status === "loading" || isLoading) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  if (!isAdmin || !isSuperAdmin) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-20">
            <FaUserShield size={50} className="text-danger mb-4" />
            <h2 className="text-2xl font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-default-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หน้านี้สำหรับ Super Admin เท่านั้น</p>
            <Button color="primary" onPress={() => router.push("/")}>
              กลับไปยังหน้าหลัก
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar isSuperAdmin={isSuperAdmin} />

      <div className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link href="/admin/users" className="text-default-500 hover:text-primary">
                  <FaArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FaUserShield className="text-primary" />
                  จัดการผู้ดูแลระบบ
                </h1>
              </div>
              <p className="text-default-500">เพิ่ม หรือลบผู้ดูแลระบบ</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                color="default"
                startContent={!isRefreshing && <FaSyncAlt />}
                onPress={handleRefreshAdmins}
                isLoading={isRefreshing}
              >
                {isRefreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
              </Button>
              <Button
                color="success"
                startContent={<FaKey />}
                onPress={handleSetupSuperAdmin}
                isLoading={isProcessing}
              >
                ตั้งค่า Super Admin
              </Button>
              <Button
                color="primary"
                startContent={<FaPlus />}
                onPress={onAddModalOpen}
              >
                เพิ่มผู้ดูแลระบบ
              </Button>
            </div>
          </div>

          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายชื่อผู้ดูแลระบบ</h2>
                <Input
                  placeholder="ค้นหา..."
                  startContent={<FaSearch />}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  size="sm"
                  className="w-full max-w-[300px]"
                />
              </div>

              {isLoadingAdmins || isRefreshing ? (
                <div className="flex justify-center py-10">
                  <Spinner label="กำลังโหลดข้อมูล..." color="primary" />
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-10">
                  <FaUsers size={40} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">ไม่พบข้อมูลผู้ดูแลระบบ</p>
                </div>
              ) : (
                <>
                  <Table aria-label="รายชื่อผู้ดูแลระบบ">
                    <TableHeader>
                      <TableColumn>ชื่อ</TableColumn>
                      <TableColumn>อีเมล</TableColumn>
                      <TableColumn>บทบาท</TableColumn>
                      <TableColumn>สิทธิ์</TableColumn>
                      <TableColumn>การจัดการ</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {displayedAdmins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Chip
                              color={admin.role === 'superadmin' ? "danger" : "primary"}
                              variant="flat"
                            >
                              {getRoleText(admin.role)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions?.map(permission => (
                                <Chip
                                  key={permission}
                                  size="sm"
                                  color="default"
                                  variant="flat"
                                >
                                  {getPermissionText(permission)}
                                </Chip>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Tooltip content="แก้ไขสิทธิ์">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="primary"
                                  variant="light"
                                  isDisabled={isMainSuperAdmin(admin)}
                                >
                                  <FaEdit />
                                </Button>
                              </Tooltip>
                              <Tooltip content="ลบสิทธิ์ผู้ดูแล">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  isDisabled={isMainSuperAdmin(admin)}
                                  onPress={() => {
                                    setSelectedAdmin(admin);
                                    onDeleteModalOpen();
                                  }}
                                >
                                  <FaTrash />
                                </Button>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-default-400 text-sm">
                      แสดง {Math.min(displayedAdmins.length, rowsPerPage)} จาก {searchTerm ? searchResults.length : admins.length} รายการ
                    </span>
                    {pages > 1 && (
                      <Pagination
                        total={pages}
                        color="primary"
                        page={page}
                        onChange={setPage}
                      />
                    )}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Modal เพิ่มผู้ดูแลระบบ */}
        <Modal
          isOpen={isAddModalOpen}
          onOpenChange={onAddModalOpenChange}
          backdrop="blur"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FaPlus className="text-primary" />
                    <span>เพิ่มผู้ดูแลระบบ</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="BKC ID ของผู้ใช้"
                    placeholder="ระบุ BKC ID ของผู้ใช้ที่ต้องการตั้งเป็นผู้ดูแลระบบ"
                    value={newAdminId}
                    onValueChange={setNewAdminId}
                    variant="bordered"
                  />

                  <Divider className="my-2" />

                  <div>
                    <p className="text-sm font-semibold mb-2">สิทธิ์การเข้าถึง:</p>
                    <CheckboxGroup
                      value={selectedPermissions}
                      onValueChange={setSelectedPermissions as (value: string[]) => void}
                    >
                      <Checkbox value="general">ทั่วไป</Checkbox>
                      <Checkbox value="complaints">จัดการเรื่องร้องเรียน</Checkbox>
                      <Checkbox value="forum">จัดการกระทู้</Checkbox>
                      <Checkbox value="users">จัดการผู้ใช้</Checkbox>
                    </CheckboxGroup>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleAddAdmin}
                    isLoading={isProcessing}
                  >
                    เพิ่มผู้ดูแล
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal ยืนยันการลบผู้ดูแลระบบ */}
        <Modal
          isOpen={isDeleteModalOpen}
          onOpenChange={onDeleteModalOpenChange}
          backdrop="blur"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-danger">
                  <div className="flex items-center gap-2">
                    <FaTrash className="text-danger" />
                    <span>ยืนยันการลบสิทธิ์ผู้ดูแล</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <p>
                    คุณกำลังจะลบสิทธิ์ผู้ดูแลระบบของ <strong>{selectedAdmin?.name}</strong>
                  </p>
                  <p className="text-danger font-semibold">
                    การกระทำนี้จะเปลี่ยนสถานะของผู้ใช้นี้เป็นผู้ใช้ทั่วไป แต่ไม่ได้ลบบัญชีออกจากระบบ
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleRemoveAdmin}
                    isLoading={isProcessing}
                  >
                    ยืนยันการลบสิทธิ์
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}