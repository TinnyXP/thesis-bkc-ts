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
  FaLock, 
  FaUnlock,
  FaTrash,
  FaSyncAlt
} from "react-icons/fa";
import { useAdmin } from "@/hooks/useAdmin";
import { Loading } from "@/components";
import { AdminSidebar } from "@/components";
import { showToast } from "@/lib/toast";

// ประกาศ interface สำหรับข้อมูลผู้ใช้
interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'user' | 'admin' | 'superadmin';
  provider: 'otp' | 'line';
  bkcId: string;
  isActive: boolean;
  profileCompleted: boolean;
  createdAt?: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, isSuperAdmin, isLoading: isLoadingAdmin } = useAdmin();
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  const fetchUsers = useCallback(async (search?: string): Promise<void> => {
    try {
      setIsLoading(true);
      const url = new URL('/api/admin/users/list', window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setSearchResults(data.users);
      } else {
        showToast(data.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้", "error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // โหลดข้อมูลผู้ใช้เมื่อเข้าสู่หน้านี้
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // ค้นหาข้อมูลผู้ใช้
  useEffect(() => {
    if (users.length > 0) {
      const results = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bkcId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setPage(1); // รีเซ็ตหน้าเมื่อมีการค้นหาใหม่
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
    
    try {
      setIsProcessing(true);
      
      // อัพเดตสถานะผู้ใช้ใน local state ทันที (Optimistic Update)
      const newStatus = !selectedUser.isActive;
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...user, isActive: newStatus } : user
      );
      
      setUsers(updatedUsers);
      setSearchResults(prev => 
        prev.map(user => user.id === selectedUser.id ? { ...user, isActive: newStatus } : user)
      );
      
      // เรียก API
      const response = await fetch(`/api/admin/users/${selectedUser.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const statusText = newStatus ? "เปิดใช้งาน" : "ระงับการใช้งาน";
        showToast(`${statusText}ผู้ใช้สำเร็จ (${selectedUser.name})`, "success");
        onBlockModalClose();
      } else {
        // หากไม่สำเร็จ ให้เปลี่ยนกลับไปเป็นค่าเดิม
        const revertedUsers = users.map(user => 
          user.id === selectedUser.id ? { ...user, isActive: selectedUser.isActive } : user
        );
        
        setUsers(revertedUsers);
        setSearchResults(prev => 
          prev.map(user => user.id === selectedUser.id ? { ...user, isActive: selectedUser.isActive } : user)
        );
        
        showToast(result.message || "ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้", "error");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      
      // หากเกิดข้อผิดพลาด ให้เปลี่ยนกลับไปเป็นค่าเดิม
      const revertedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...user, isActive: selectedUser.isActive } : user
      );
      
      setUsers(revertedUsers);
      setSearchResults(prev => 
        prev.map(user => user.id === selectedUser.id ? { ...user, isActive: selectedUser.isActive } : user)
      );
      
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // จัดการการลบผู้ใช้
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsProcessing(true);
      
      // อัพเดตรายการผู้ใช้ใน local state ทันที (Optimistic Update)
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setSearchResults(prev => prev.filter(user => user.id !== selectedUser.id));
      
      // ปิด Modal ทันที เพื่อให้ UX ดีขึ้น
      onDeleteModalClose();
      
      // เรียก API
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`ลบผู้ใช้ ${selectedUser.name} สำเร็จ`, "success");
      } else {
        // หากไม่สำเร็จ ให้เพิ่มกลับคืนเข้าไปในรายการ
        setUsers(prev => [...prev, selectedUser]);
        setSearchResults(prev => {
          if (searchTerm && (
              selectedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              selectedUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              selectedUser.bkcId.toLowerCase().includes(searchTerm.toLowerCase())
          )) {
            return [...prev, selectedUser];
          }
          return prev;
        });
        
        showToast(result.message || "ไม่สามารถลบผู้ใช้ได้", "error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      
      // หากเกิดข้อผิดพลาด ให้เพิ่มกลับคืนเข้าไปในรายการ
      setUsers(prev => [...prev, selectedUser]);
      setSearchResults(prev => {
        if (searchTerm && (
            selectedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            selectedUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            selectedUser.bkcId.toLowerCase().includes(searchTerm.toLowerCase())
        )) {
          return [...prev, selectedUser];
        }
        return prev;
      });
      
      showToast("เกิดข้อผิดพลาดในการลบผู้ใช้", "error");
    } finally {
      setIsProcessing(false);
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
                onPress={() => fetchUsers()}
                isLoading={isLoading}
                startContent={!isLoading && <FaSyncAlt />}
              >
                {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
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
              
              {isLoading ? (
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
                              <Tooltip content={user.isActive ? "บล็อกผู้ใช้ (แบนชั่วคราว)" : "ปลดบล็อก"}>
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  color={user.isActive ? "warning" : "success"}
                                  variant="light"
                                  isDisabled={user.role === 'superadmin'}
                                  onPress={() => {
                                    setSelectedUser(user);
                                    onBlockModalOpen();
                                  }}
                                >
                                  {user.isActive ? <FaLock /> : <FaUnlock />}
                                </Button>
                              </Tooltip>
                              <Tooltip content="ลบผู้ใช้ (แบนถาวร)">
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  color="danger" 
                                  variant="light"
                                  isDisabled={user.role === 'superadmin'}
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
                      แสดง {Math.min(displayedUsers.length, rowsPerPage)} จาก {searchTerm ? searchResults.length : users.length} รายการ
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
                        <span>บล็อกผู้ใช้ (แบนชั่วคราว)</span>
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
                    <span>ยืนยันการลบผู้ใช้ (แบนถาวร)</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <p>
                    คุณกำลังจะลบผู้ใช้ <strong>{selectedUser?.name}</strong>
                  </p>
                  <p className="text-danger font-semibold">
                    การกระทำนี้จะลบข้อมูลผู้ใช้อย่างถาวร (แบนถาวร) ไม่สามารถยกเลิกได้
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