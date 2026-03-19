import { useState, useEffect } from 'react'
import { Card, Radio, Row, Col, Statistic } from 'antd'
import { ClockCircleOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '../services/api'
import dayjs from 'dayjs'

interface StatsData {
  period: {
    type: string
    startDate: string
    endDate: string
  }
  summary: {
    totalHours: number
    totalDays: number
    avgHoursPerDay: number
  }
  byProject: Array<{
    projectId: number
    projectName: string
    hours: number
    percentage: number
  }>
  dailyTrend: Array<{
    date: string
    hours: number
  }>
}

export default function Statistics() {
  const [type, setType] = useState<'week' | 'month'>('week')
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [type])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await statsApi.personal(type)
      if (res.code === 0) {
        setData(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const getProjectPieOption = () => {
    if (!data?.byProject?.length) {
      return {}
    }
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}h ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '工时分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          data: data.byProject.map(p => ({
            value: p.hours,
            name: p.projectName
          }))
        }
      ]
    }
  }

  const getDailyTrendOption = () => {
    if (!data?.dailyTrend?.length) {
      return {}
    }
    return {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: data.dailyTrend.map(d => dayjs(d.date).format('MM-DD'))
      },
      yAxis: {
        type: 'value',
        name: '小时'
      },
      series: [
        {
          name: '工时',
          type: 'bar',
          data: data.dailyTrend.map(d => d.hours),
          itemStyle: {
            color: '#1890ff',
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Radio.Group value={type} onChange={(e) => setType(e.target.value)}>
          <Radio.Button value="week">本周</Radio.Button>
          <Radio.Button value="month">本月</Radio.Button>
        </Radio.Group>
        {data && (
          <span style={{ marginLeft: 24, color: '#999' }}>
            统计周期：{data.period.startDate} ~ {data.period.endDate}
          </span>
        )}
      </Card>

      {data && (
        <>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="总工时"
                  value={data.summary.totalHours}
                  suffix="小时"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="工作天数"
                  value={data.summary.totalDays}
                  suffix="天"
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="日均工时"
                  value={data.summary.avgHoursPerDay}
                  suffix="小时/天"
                  precision={1}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Card title="项目工时分布">
                {data.byProject.length > 0 ? (
                  <ReactECharts option={getProjectPieOption()} style={{ height: 300 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="每日工时趋势">
                {data.dailyTrend.length > 0 ? (
                  <ReactECharts option={getDailyTrendOption()} style={{ height: 300 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
