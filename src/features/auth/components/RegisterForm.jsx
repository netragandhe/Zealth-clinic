import React, { useState } from 'react'
import { Form, Input, Button, Checkbox, Modal } from 'antd'
import { MailOutlined, LockOutlined, BankOutlined, UserOutlined, SafetyCertificateOutlined, FileProtectOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../../api/axios'

// ── Terms & Conditions content ──────────────────────────────────────────────
const TERMS_CONTENT = (
  <div className="text-sm text-slate-700 space-y-4 leading-relaxed">
    <p className="text-xs text-slate-500">Last updated: September 2026</p>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">1. Acceptance of Terms</h4>
      <p>By creating an account on ZealthOS, you agree to be bound by these Terms & Conditions. If you do not agree, please do not register or use our platform.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">2. Use of the Platform</h4>
      <p>ZealthOS is a practice management platform for registered allied health and medical clinics. You agree to use the platform only for lawful purposes and in compliance with all applicable healthcare regulations, including (where applicable) the Australian Privacy Act 1988, HIPAA, and relevant state health information legislation.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">3. Account Responsibilities</h4>
      <p>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Notify us immediately of any suspected unauthorised access.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">4. Clinical Data & Records</h4>
      <p>You retain ownership of all clinical data entered into ZealthOS. By using the platform, you grant ZealthOS a limited licence to store and process this data solely to provide the services described herein. We do not sell or share your client data with third parties.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">5. Subscription & Billing</h4>
      <p>Access to certain features requires an active subscription. Fees are billed in advance on a monthly or annual basis. Cancellations take effect at the end of the current billing cycle. No refunds are issued for partial periods.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">6. Service Availability</h4>
      <p>We aim for 99.9% uptime but do not guarantee uninterrupted service. Planned maintenance windows will be communicated in advance. We are not liable for losses arising from temporary unavailability.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">7. Limitation of Liability</h4>
      <p>ZealthOS is a software tool and does not constitute medical, clinical, or legal advice. We are not liable for clinical decisions made using information from the platform. Our total liability to you shall not exceed the fees paid in the 12 months preceding the claim.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">8. Termination</h4>
      <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or otherwise misuse the platform.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">9. Changes to Terms</h4>
      <p>We may update these Terms from time to time. Continued use of ZealthOS after changes are posted constitutes acceptance of the revised Terms.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">10. Contact</h4>
      <p>Questions about these Terms? Contact us at <span className="text-violet-600 font-medium">legal@zealthos.com</span></p>
    </section>
  </div>
)

// ── Privacy Policy content ───────────────────────────────────────────────────
const PRIVACY_CONTENT = (
  <div className="text-sm text-slate-700 space-y-4 leading-relaxed">
    <p className="text-xs text-slate-500">Last updated: September 2026</p>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">1. Information We Collect</h4>
      <p>We collect information you provide directly, including: clinic name, contact details, practitioner profiles, appointment records, clinical notes, invoices, and client health information entered by authorised clinic staff.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">2. How We Use Your Information</h4>
      <ul className="list-disc pl-4 space-y-1">
        <li>To provide, maintain, and improve the ZealthOS platform</li>
        <li>To process billing and subscriptions</li>
        <li>To send service notifications and support communications</li>
        <li>To comply with our legal obligations</li>
      </ul>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">3. Health Information</h4>
      <p>ZealthOS treats all patient health information as sensitive data. We apply strict access controls, encryption at rest and in transit, and audit logging to protect clinical records. We do not use patient health data for advertising or sell it to any third party.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">4. Data Storage & Security</h4>
      <p>All data is stored on secure cloud infrastructure with AES-256 encryption. Access is restricted to authenticated and authorised clinic staff only. We conduct regular security audits and penetration testing.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">5. Data Sharing</h4>
      <p>We do not sell your data. We may share data with:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Trusted infrastructure providers (e.g. cloud hosting) under strict data processing agreements</li>
        <li>Law enforcement if required by applicable law</li>
        <li>Successors in the event of a merger or acquisition, with advance notice to you</li>
      </ul>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">6. Your Rights</h4>
      <p>You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at <span className="text-violet-600 font-medium">privacy@zealthos.com</span>. We will respond within 30 days.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">7. Cookies</h4>
      <p>We use essential cookies only — for session management and security. We do not use third-party advertising cookies. You may disable non-essential cookies in your browser settings.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">8. Retention</h4>
      <p>We retain your data for as long as your account is active, plus a 7-year archival period for compliance purposes (standard for health records in Australia). You may request early deletion of non-clinical account data.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">9. Changes to This Policy</h4>
      <p>We will notify you by email before any material changes to this Privacy Policy take effect.</p>
    </section>

    <section>
      <h4 className="font-bold text-slate-800 mb-1">10. Contact Us</h4>
      <p>Privacy questions or complaints: <span className="text-violet-600 font-medium">privacy@zealthos.com</span></p>
    </section>
  </div>
)

export default function RegisterForm() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedPlan = searchParams.get('plan') || ''
  const selectedCycle = searchParams.get('cycle') || 'Monthly'

  const [loading, setLoading] = useState(false)
  const [termsVisible, setTermsVisible] = useState(false)
  const [privacyVisible, setPrivacyVisible] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        organization: values.organization,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        plan: selectedPlan || 'Basic',
        billingCycle: selectedCycle,
      })

      if (res.data?.success) {
        toast.success(res.data?.message || 'Organization registered successfully! Welcome to ZealthOS.')
        navigate('/login', { state: { registeredEmail: values.email } })
      } else {
        toast.error(res.data?.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration API Error:', err)
      toast.error(err.response?.data?.message || 'Failed to register clinic in database')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-transparent px-4">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Create Account</h3>
        <p className="text-slate-500 dark:text-slate-300 text-xs mt-0.5">Set up your clinic workspace in minutes</p>
      </div>

      {selectedPlan && (
        <div className="mb-3.5 px-3.5 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center justify-between shadow-sm">
          <span>✨ Selected Plan: <strong className="capitalize">{selectedPlan}</strong> ({selectedCycle})</span>
          <button
            type="button"
            onClick={() => navigate('/#pricing')}
            className="text-[11px] text-violet-600 dark:text-violet-400 font-bold underline bg-transparent border-0 cursor-pointer hover:opacity-80"
          >
            Change
          </button>
        </div>
      )}

      <Form
        form={form}
        name="register_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="w-full space-y-3.5"
        initialValues={{
          organization: '',
          fullName: '',
          email: '',
          password: '',
          agree: false,
        }}
      >
        <Form.Item
          name="organization"
          label={<span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Organization / Clinic Name</span>}
          rules={[{ required: true, message: 'Please enter your clinic name' }]}
          className="mb-1.5"
        >
          <Input
            prefix={<BankOutlined className="text-slate-400 mr-2" />}
            placeholder="e.g. Apex Physiotherapy"
            size="large"
            className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white focus:bg-white dark:bg-slate-900 focus:border-brand-purple transition-all duration-200"
          />
        </Form.Item>

        <Form.Item
          name="fullName"
          label={<span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Contact Full Name</span>}
          rules={[{ required: true, message: 'Please enter your name' }]}
          className="mb-1.5"
        >
          <Input
            prefix={<UserOutlined className="text-slate-400 mr-2" />}
            placeholder="e.g. Jane Doe"
            size="large"
            className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white focus:bg-white dark:bg-slate-900 focus:border-brand-purple transition-all duration-200"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Email</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
          className="mb-1.5"
        >
          <Input
            prefix={<MailOutlined className="text-slate-400 mr-2" />}
            placeholder="you@organization.com"
            size="large"
            className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white focus:bg-white dark:bg-slate-900 focus:border-brand-purple transition-all duration-200"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Password</span>}
          rules={[{ required: true, message: 'Please set your password' }]}
          className="mb-1.5"
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400 mr-2" />}
            placeholder="At least 8 characters"
            size="large"
            className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white focus:bg-white dark:bg-slate-900 focus:border-brand-purple transition-all duration-200"
          />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms & conditions')),
            },
          ]}
          className="mb-4"
        >
          <Checkbox className="text-slate-500 dark:text-slate-300 text-xs font-semibold select-none">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setTermsVisible(true)}
              className="text-violet-600 hover:text-violet-700 hover:underline font-semibold bg-transparent border-none cursor-pointer p-0 inline"
            >
              Terms &amp; Conditions
            </button>
            {' '}and{' '}
            <button
              type="button"
              onClick={() => setPrivacyVisible(true)}
              className="text-violet-600 hover:text-violet-700 hover:underline font-semibold bg-transparent border-none cursor-pointer p-0 inline"
            >
              Privacy Policy
            </button>
          </Checkbox>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full h-11 bg-brand-purple hover:bg-brand-purple/90 border-none font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1"
          >
            <span>Register Clinic</span>
            <span className="text-lg leading-none font-normal">→</span>
          </Button>
        </Form.Item>
      </Form>

      {/* ── Terms & Conditions Modal ─────────────────────────────────────── */}
      <Modal
        open={termsVisible}
        onCancel={() => setTermsVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="primary"
              onClick={() => {
                setTermsVisible(false)
                form.setFieldValue('agree', true)
              }}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-lg font-bold"
            >
              I Accept
            </Button>
            <Button onClick={() => setTermsVisible(false)} className="rounded-lg">
              Close
            </Button>
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            <SafetyCertificateOutlined style={{ color: '#8C4BFF', fontSize: 18 }} />
            <span className="font-extrabold text-slate-800">Terms &amp; Conditions</span>
          </div>
        }
        width={640}
        styles={{ body: { maxHeight: '65vh', overflowY: 'auto', padding: '16px 24px' } }}
        className="rounded-2xl"
        destroyOnClose={false}
      >
        {TERMS_CONTENT}
      </Modal>

      {/* ── Privacy Policy Modal ─────────────────────────────────────────── */}
      <Modal
        open={privacyVisible}
        onCancel={() => setPrivacyVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="primary"
              onClick={() => {
                setPrivacyVisible(false)
                form.setFieldValue('agree', true)
              }}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-lg font-bold"
            >
              I Accept
            </Button>
            <Button onClick={() => setPrivacyVisible(false)} className="rounded-lg">
              Close
            </Button>
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            <FileProtectOutlined style={{ color: '#8C4BFF', fontSize: 18 }} />
            <span className="font-extrabold text-slate-800">Privacy Policy</span>
          </div>
        }
        width={640}
        styles={{ body: { maxHeight: '65vh', overflowY: 'auto', padding: '16px 24px' } }}
        className="rounded-2xl"
        destroyOnClose={false}
      >
        {PRIVACY_CONTENT}
      </Modal>
    </div>
  )
}
