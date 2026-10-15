import React, { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Checkbox, Tag, Space, Divider } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../store/clinicStore'

const { Option } = Select

const PERMISSIONS_LIST = [
  { value: 'manageDashboard', label: 'Dashboard' },
  { value: 'manageCalendar', label: 'Calendar' },
  { value: 'manageClients', label: 'Clients' },
  { value: 'manageConsultations', label: 'Consultations' },
  { value: 'manageContacts', label: 'Contacts' },
  { value: 'manageWaitlist', label: 'Waitlist' },
  { value: 'manageDocuments', label: 'Documents' },
  { value: 'manageReports', label: 'Reports' },
  { value: 'manageProducts', label: 'Products' },
  { value: 'managePayments', label: 'Payments' },
  { value: 'manageInvoices', label: 'Invoices' },
  { value: 'manageSettings', label: 'Settings' },
]

export default function RolesPermissionsTab() {
  const store = useClinicStore()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingUser, setEditingUser] = useState(null)
  
  // Consolidate users from existing arrays
  const practitioners = (store.practitioners || []).map(p => ({ ...p, roleGroup: 'practitioner' }))
  const admins = (store.admins || []).map(a => ({ ...a, roleGroup: 'admin' }))
  
  // Combine all users for the table
  const allUsers = [...practitioners, ...admins]

  const showModal = (record = null) => {
    setEditingUser(record)
    if (record) {
      form.setFieldsValue({
        ...record,
        permissions: record.permissions ? Object.keys(record.permissions).filter(k => record.permissions[k]) : []
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ status: 'Active', permissions: [] })
    }
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingUser(null)
  }

  const handleSave = (values) => {
    const permissionsObj = {}
    PERMISSIONS_LIST.forEach(p => {
      permissionsObj[p.value] = values.permissions?.includes(p.value)
    })

    const newUser = {
      id: editingUser ? editingUser.id : `usr_${Date.now()}`,
      name: values.name,
      email: values.email,
      phone: values.phone,
      role: values.role,
      roleGroup: values.roleGroup,
      status: values.status,
      permissions: permissionsObj,
      avatar: editingUser ? editingUser.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(values.name)}&background=random`
    }

    if (values.roleGroup === 'practitioner') {
      let newList = [...(store.practitioners || [])]
      if (editingUser && editingUser.roleGroup === 'practitioner') {
        newList = newList.map(u => u.id === editingUser.id ? newUser : u)
      } else {
        newList.push(newUser)
      }
      // Note: In a real app we'd call a store action.
    } else if (values.roleGroup === 'admin') {
      let newList = [...(store.admins || [])]
      if (editingUser && editingUser.roleGroup === 'admin') {
        newList = newList.map(u => u.id === editingUser.id ? newUser : u)
      } else {
        newList.push(newUser)
      }
    }

    toast.success(editingUser ? 'User updated successfully' : 'User created successfully')
    setIsModalVisible(false)
    form.resetFields()
    setEditingUser(null)
  }

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            {record.avatar ? (
              <img src={record.avatar} alt={record.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <SafetyCertificateOutlined />
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-slate-700 dark:text-slate-200">{record.name}</div>
            <div className="text-xs text-slate-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role Type',
      dataIndex: 'roleGroup',
      key: 'roleGroup',
      render: (roleGroup) => (
        <Tag className="uppercase text-[10px] tracking-wider font-bold">
          {roleGroup}
        </Tag>
      )
    },
    {
      title: 'Specific Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span className="text-slate-600 font-semibold">{role || 'Standard'}</span>
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status || 'Active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => toast.success('User removed')} />
        </Space>
      ),
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-slate-800 dark:text-white">Roles & Permissions</h2>
          <p className="text-sm text-slate-500">Manage access and configure permissions for clinic staff.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Add User
        </Button>
      </div>

      <Table
        dataSource={allUsers}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden"
      />

      <Modal
        title={editingUser ? 'Edit User & Permissions' : 'Create New User'}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        width={700}
        okText={editingUser ? 'Update User' : 'Create User'}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="john@example.com" />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input placeholder="+61 400 000 000" />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item name="roleGroup" label="Account Type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                <Option value="practitioner">Practitioner</Option>
                <Option value="admin">Admin Staff</Option>
                <Option value="sales">Sales Staff</Option>
              </Select>
            </Form.Item>
            <Form.Item name="role" label="Specific Role (Job Title)" rules={[{ required: true }]}>
              <Input placeholder="e.g. Senior Physiotherapist or Manager" />
            </Form.Item>
          </div>

          <Divider orientation="left">Module Permissions</Divider>
          <Form.Item name="permissions">
            <Checkbox.Group className="w-full">
              <div className="grid grid-cols-3 gap-3">
                {PERMISSIONS_LIST.map(p => (
                  <Checkbox key={p.value} value={p.value}>{p.label}</Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
