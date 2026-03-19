import { useState, useEffect } from 'react'
import { Form, Select, InputNumber, DatePicker, Input, Button, Card, message } from 'antd'
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { timesheetApi, projectApi, statsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Project {
  id: number
  name: string
}

interface Summary {
  today: number
  week: number
  month: number
}

export default function TimeEntry() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [summary, setSummary] = useState<Summary>({ today: 0, week: 0, month: 0 })
  const { user } = useAuthStore()

  useEffect(() => {
    loadProjects()
    loadSummary()
  }, [])

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

  const loadSummary = async () => {
    try {
      const res = await statsApi.summary()
      if (res.code === 0) {
        setSummary(res.data)
      }
    } catch (error) {
      console.error('加载统计失败', error)
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const data = {
        projectId: values.projectId,
        task: values.task,
        hours: values.hours,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note || null
      }
      const res = await timesheetApi.create(data)
      if (res.code === 0) {
        message.success('提交成功')
        form.resetFields()
        form.setFieldsValue({ date: dayjs() })
        loadSummary()
      } else {
        message.error(res.message)
      }
    } catch (error: any) {
      message.error('提交失败：' + (error.response?.data?.message || '网络错误'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card title="工时填报" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ date: dayjs() }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="projectId"
              label="项目"
              rules={[{ required: true, message: '请选择项目' }]}
            >
              <Select placeholder="请选择项目" size="large">
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
              <Input placeholder="如：功能开发、测试、会议" size="large" maxLength={200} />
            </Form.Item>

            <Form.Item
              name="hours"
              label="时长（小时）"
              rules={[{ required: true, message: '请输入时长' }]}
            >
              <InputNumber 
                placeholder="0.5 - 24" 
                size="large" 
                min={0.5} 
                max={24} 
                step={0.5}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="date"
              label="日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker 
                size="large" 
                style={{ width: '100%' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </div>

          <Form.Item name="note" label="备注（可选）">
            <Input.TextArea 
              placeholder="工作内容说明..." 
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              提交工时
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 14, color: '#999' }}>今日已填报</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', marginTop: 8 }}>
              {summary.today}<span style={{ fontSize: 14, marginLeft: 4 }}>小时</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#999' }}>本周累计</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a', marginTop: 8 }}>
              {summary.week}<span style={{ fontSize: 14, marginLeft: 4 }}>小时</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#999' }}>本月累计</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#722ed1', marginTop: 8 }}>
              {summary.month}<span style={{ fontSize: 14, marginLeft: 4 }}>小时</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
