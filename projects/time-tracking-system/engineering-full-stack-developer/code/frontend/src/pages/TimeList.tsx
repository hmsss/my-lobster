import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Select, InputNumber, DatePicker, Input, message, Popconfirm, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { timesheetApi, projectApi } from '../services/api'

interface TimeEntry {
  id: number
  projectId: number
  projectName: string
  task: string
  hours: number
  date: string
  note: string | null
  createdAt: string
}

interface Project {
  id: number
  name: string
}

export default function TimeList() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadEntries()
    loadProjects()
  }, [page, pageSize])

  const loadEntries = async () => {
    setLoading(true)
    try {
      const res = await timesheetApi.list({ page, pageSize })
      if (res.code === 0) {
        setEntries(res.data.items)
        setTotal(res.data.total)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const res = await projectApi.list('active')
      if (res.code === 0) {
        setProjects(res.data)
      }
    } catch (error) {
      console.error('加载项目失败', error)
    }
  }

  const handleEdit = (record: TimeEntry) => {
    setEditingEntry(record)
    form.setFieldsValue({
      projectId: record.projectId,
      task: record.task,
      hours: record.hours,
      date: dayjs(record.date),
      note: record.note
    })
    setEditModalVisible(true)
  }

  const handleUpdate = async (values: any) => {
    if (!editingEntry) return
    try {
      const data = {
        projectId: values.projectId,
        task: values.task,
        hours: values.hours,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note || null
      }
      const res = await timesheetApi.update(editingEntry.id, data)
      if (res.code === 0) {
        message.success('更新成功')
        setEditModalVisible(false)
        loadEntries()
      } else {
        message.error(res.message)
      }
    } catch (error: any) {
      message.error('更新失败：' + (error.response?.data?.message || '网络错误'))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await timesheetApi.delete(id)
      if (res.code === 0) {
        message.success('删除成功')
        loadEntries()
      } else {
        message.error(res.message)
      }
    } catch (error: any) {
      message.error('删除失败：' + (error.response?.data?.message || '网络错误'))
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
    },
    {
      title: '任务',
      dataIndex: 'task',
      key: 'task',
      width: 200,
    },
    {
      title: '时长',
      dataIndex: 'hours',
      key: 'hours',
      width: 100,
      render: (hours: number) => <Tag color="blue">{hours}h</Tag>
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: TimeEntry) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card title="我的工时记录">
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          }
        }}
      />

      <Modal
        title="编辑工时"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="projectId"
            label="项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择项目">
              {projects.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="task"
            label="任务"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input maxLength={200} />
          </Form.Item>

          <Form.Item
            name="hours"
            label="时长（小时）"
            rules={[{ required: true, message: '请输入时长' }]}
          >
            <InputNumber min={0.5} max={24} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
