// src/app/admin/users/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Card,
  CardBody,
  Pagination,
  Tooltip,
  useDisclosure,
  Avatar,
  AvatarIcon,
  Chip,
  Divider,
  Spinner
} from "@heroui/react";
import { 
  FaUsers, 
  FaUserShield, 
  FaSearch, 
  FaUserEdit, 
  FaLock, 
  FaUnlock,
  FaTrash
} from "react-icons/fa";
import { useAdmin } from "@/hooks/useAdmin";
import { useUsersManagement, User } from "@/hooks/useUsersManagement";
import { Loading } from "@/components";
import { AdminSidebar } from "@/components";
import { showToast } from "@/lib/toast";

export default function UsersManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, isSuperAdmin, isLoading: isLoadingAdmin } = useAdmin();
  const { 
    isLoading: isLoadingUsers, 
    isProcessing,
    fetchUsers,
    toggleUserStatus,
    deleteUser,
    updateUser
  } = useUsersManagement();
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    isOpen: isBlockModalOpen, 
    onOpen: onBlockModalOpen, 
    onClose: onBlockModalClose,
    onOpenChange: onBlockModalOpenChange
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: onDeleteModalOpen, 
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();

  // ตรวจสอบสิทธิ์การเข้าถึงหน้านี้
  useEffect(() => {
    if (status === "authenticated" && !isLoadingAdmin) {
      if (!isAdmin) {
        showToast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้", "error");
        router.push("/");
      }
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, isAdmin, isLoadingAdmin, router]);

  // โหลดข้อมูลผู้ใช้
  const loadUsers = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchUsers(searchTerm || undefined);
      setUsers(data);
      setSearchResults(data);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUsers, searchTerm]);

  // โหลดข้อมูลผู้ใช้เมื่อเข้าสู่หน้านี้
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  // ค้นหาข้อมูลผู้ใช้
  useEffect(() => {
    if (users.length > 0) {
      const results = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bkcId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    }
  }, [searchTerm, users]);

  // คำนวณข้อมูลที่แสดงในตาราง
  const displayedUsers = React.useMemo(() => {
    const results = searchTerm ? searchResults : users;
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return results.slice(start, end);
  }, [page, rowsPerPage, searchTerm, searchResults, users]);

  // จัดการการบล็อก/ปลดบล็อกผู้ใช้
  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    const success = await toggleUserStatus(selectedUser.id, selectedUser.isActive);
    
    if (success) {
      // อัพเดตสถานะผู้ใช้ใน local state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...user, isActive: !user.isActive } : user
      );
      
      setUsers(updatedUsers);
      onBlockModalClose();
    }
  };

  // จัดการการลบผู้ใช้
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    const success = await deleteUser(selectedUser.id);
    
    if (success) {
      // อัพเดตรายการผู้ใช้ใน local state
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      onDeleteModalClose();
    }
  };

  // Pagination
  const pages = Math.ceil((searchTerm ? searchResults.length : users.length) / rowsPerPage);

  // แปลงประเภทการลงทะเบียนเป็นข้อความภาษาไทย
  const getProviderText = (provider: string): string => {
    switch (provider) {
      case 'line': return 'LINE';
      case 'otp': return 'อีเมล (OTP)';
      default: return provider;
    }
  };

  if (status === "loading" || isLoadingAdmin) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-20">
            <FaUserShield size={50} className="text-danger mb-4" />
            <h2 className="text-2xl font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-default-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FaUsers className="text-primary" />
                จัดการผู้ใช้งาน
              </h1>
              <p className="text-default-500">จัดการข้อมูลของผู้ใช้ทั้งหมด</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                color="default" 
                onPress={loadUsers}
                isLoading={isRefreshing}
              >
                รีเฟรช
              </Button>
              
              {isSuperAdmin && (
                <Button 
                  color="primary" 
                  onPress={() => router.push("/admin/users/admins")}
                  startContent={<FaUserShield />}
                >
                  จัดการผู้ดูแลระบบ
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายชื่อผู้ใช้</h2>
                <Input
                  placeholder="ค้นหา..."
                  startContent={<FaSearch />}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  size="sm"
                  className="w-full max-w-[300px]"
                />
              </div>
              
              {isLoadingUsers || isRefreshing ? (
                <div className="flex justify-center py-10">
                  <Spinner label="กำลังโหลดข้อมูล..." color="primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-10">
                  <FaUsers size={40} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">ไม่พบข้อมูลผู้ใช้</p>
                </div>
              ) : (
                <>
                  <Table aria-label="รายชื่อผู้ใช้">
                    <TableHeader>
                      <TableColumn>ชื่อ</TableColumn>
                      <TableColumn>อีเมล</TableColumn>
                      <TableColumn>ประเภท</TableColumn>
                      <TableColumn>สถานะ</TableColumn>
                      <TableColumn>การจัดการ</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {displayedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                icon={<AvatarIcon />}
                                src={user.image || undefined}
                                showFallback
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-default-500">{user.bkcId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip color="default" variant="flat" size="sm">
                              {getProviderText(user.provider)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              color={user.isActive ? "success" : "danger"} 
                              variant="flat"
                            >
                              {user.isActive ? "ใช้งานอยู่" : "ถูกระงับ"}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Tooltip content="แก้ไขข้อมูล">
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  color="primary" 
                                  variant="light"
                                >
                                  <FaUserEdit />
                                </Button>
                              </Tooltip>
                              <Tooltip content={user.isActive ? "บล็อกผู้ใช้" : "ปลดบล็อก"}>
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  color={user.isActive ? "warning" : "success"}
                                  variant="light"
                                  onPress={() => {
                                    setSelectedUser(user);
                                    onBlockModalOpen();
                                  }}
                                >
                                  {user.isActive ? <FaLock /> : <FaUnlock />}
                                </Button>
                              </Tooltip>
                              <Tooltip content="ลบผู้ใช้">
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  color="danger" 
                                  variant="light"
                                  onPress={() => {
                                    setSelectedUser(user);
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
                      แสดง {Math.min(displayedUsers.length, rowsPerPage)} จาก {users.length} รายการ
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

        {/* Modal บล็อก/ปลดบล็อกผู้ใช้ */}
        <Modal 
          isOpen={isBlockModalOpen} 
          onOpenChange={onBlockModalOpenChange}
          backdrop="blur"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {selectedUser?.isActive ? (
                      <>
                        <FaLock className="text-warning" />
                        <span>บล็อกผู้ใช้</span>
                      </>
                    ) : (
                      <>
                        <FaUnlock className="text-success" />
                        <span>ปลดบล็อกผู้ใช้</span>
                      </>
                    )}
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedUser?.isActive ? (
                    <p>
                      คุณกำลังจะบล็อกผู้ใช้ <strong>{selectedUser?.name}</strong> ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะถูกปลดบล็อก
                    </p>
                  ) : (
                    <p>
                      คุณกำลังจะปลดบล็อกผู้ใช้ <strong>{selectedUser?.name}</strong> ผู้ใช้นี้จะสามารถเข้าสู่ระบบได้ตามปกติ
                    </p>
                  )}
                  
                  <Divider className="my-2" />
                  
                  <div className="mt-2">
                    <p className="text-sm text-default-500">
                      <strong>อีเมล:</strong> {selectedUser?.email}
                    </p>
                    <p className="text-sm text-default-500">
                      <strong>BKC ID:</strong> {selectedUser?.bkcId}
                    </p>
                    <p className="text-sm text-default-500">
                      <strong>ประเภท:</strong> {selectedUser && getProviderText(selectedUser.provider)}
                    </p>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button 
                    color={selectedUser?.isActive ? "warning" : "success"} 
                    onPress={handleToggleUserStatus}
                    isLoading={isProcessing}
                  >
                    {selectedUser?.isActive ? "บล็อกผู้ใช้" : "ปลดบล็อก"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal ยืนยันการลบผู้ใช้ */}
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
                    <span>ยืนยันการลบผู้ใช้</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <p>
                    คุณกำลังจะลบผู้ใช้ <strong>{selectedUser?.name}</strong>
                  </p>
                  <p className="text-danger font-semibold">
                    การกระทำนี้จะลบข้อมูลผู้ใช้อย่างถาวร ไม่สามารถยกเลิกได้
                  </p>
                  
                  <Divider className="my-2" />
                  
                  <div className="mt-2">
                    <p className="text-sm text-default-500">
                      <strong>อีเมล:</strong> {selectedUser?.email}
                    </p>
                    <p className="text-sm text-default-500">
                      <strong>BKC ID:</strong> {selectedUser?.bkcId}
                    </p>
                    <p className="text-sm text-default-500">
                      <strong>ประเภท:</strong> {selectedUser && getProviderText(selectedUser.provider)}
                    </p>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button 
                    color="danger" 
                    onPress={handleDeleteUser}
                    isLoading={isProcessing}
                  >
                    ยืนยันการลบผู้ใช้
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