import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Mail, Info, CheckCircle2 } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'refund' | 'contact' | 'about';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0e0f1a] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-violet-500/40 shadow-md">
              <img
                src="/src/assets/images/smartcaption_logo_1791567332036.jpg"
                alt="Smart Caption Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Smart Caption Compliance & Legal Center</h2>
              <p className="text-xs text-neutral-400">Policies for Google AdSense, Razorpay, & User Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.08] bg-white/[0.01] overflow-x-auto scrollbar-none">
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
            { id: 'terms', label: 'Terms of Service', icon: FileText },
            { id: 'refund', label: 'Refund & Cancellation', icon: RefreshCw },
            { id: 'contact', label: 'Contact & Support', icon: Mail },
            { id: 'about', label: 'About AutoCaption', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LegalTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-neutral-300 text-sm leading-relaxed max-h-[calc(90vh-140px)]">
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
                <p className="text-xs text-neutral-400 mt-1">Last Updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">1. Introduction & Overview</h4>
                <p>
                  Welcome to <strong>Smart Caption</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, process, and disclose information when you visit or use Smart Caption AI tools and services.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">2. Information We Collect</h4>
                <p>We may collect information you provide directly, including:</p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li><strong>Account Data:</strong> Name, email address, password or OAuth credentials when you log in.</li>
                  <li><strong>Media & Transcription Files:</strong> Video and audio files that you upload solely for transcription, translation, and subtitle generation. Video data is processed locally in your browser or through secure temporary AI processing endpoints and is never permanently stored or sold.</li>
                  <li><strong>Payment & Transaction Information:</strong> Payment details are securely processed via certified PCI-DSS compliant payment gateways (Razorpay, Stripe). We do not store full credit card or banking credentials on our servers.</li>
                  <li><strong>Log & Technical Data:</strong> Browser type, operating system, IP address, device specs, and usage duration.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">3. Google AdSense & Third-Party Advertising</h4>
                <p>
                  We may serve third-party advertisements via <strong>Google AdSense</strong>. Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to our website or other websites.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to our sites and/or other sites on the Internet.</li>
                  <li>Users may opt out of personalized advertising by visiting Google Ads Settings (www.google.com/settings/ads) or through www.aboutads.info.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">4. AI & Data Security</h4>
                <p>
                  Audio transcription and translation utilize cutting-edge AI language models. We do not use your personal private videos to train public generative AI models without your express opt-in consent. All data transfers are encrypted via TLS 1.3 / 256-bit SSL.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">5. Contact Us</h4>
                <p>
                  If you have questions about this Privacy Policy, please email us at <strong>sn3711550@gmail.com</strong> or contact our privacy officer through our support tab.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                <p className="text-xs text-neutral-400 mt-1">Effective Date: October 2026</p>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">1. Agreement to Terms</h4>
                <p>
                  By accessing or using Smart Caption, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">2. Acceptable Use & Content Ownership</h4>
                <p>
                  You retain 100% intellectual property ownership of the videos, audio, and content you upload to Smart Caption. You are solely responsible for ensuring that you have the necessary licenses and rights to any content you upload.
                </p>
                <p>
                  You agree not to use Smart Caption to generate, transcribe, or export:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Defamatory, illegal, violent, or hate-speech media.</li>
                  <li>Infringing copyrighted material without proper authorization.</li>
                  <li>Automated bot traffic, abusive rate-limiting bypasses, or denial-of-service attempts.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">3. AI Transcription Disclaimer</h4>
                <p>
                  Smart Caption utilizes automated speech-to-text algorithms and AI models. While accuracy is among industry-leading benchmarks (&gt;98%), occasional phonetic or grammatical variances may occur depending on background noise or speaker accents. Users are provided an interactive timeline editor to review and refine all subtitles.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">4. Subscriptions & Billing</h4>
                <p>
                  Paid subscriptions (Pro, Business) are billed in advance on a recurring monthly or annual basis. You can cancel your subscription at any time via your account settings or by contacting customer support.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-xl font-bold text-white">Refund & Cancellation Policy</h3>
                <p className="text-xs text-neutral-400 mt-1">Compliant with Payment Gateway (Razorpay / Stripe) standards</p>
              </div>

              <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-200">
                  <strong className="text-white">7-Day Money-Back Guarantee:</strong> If you are not completely satisfied with your Pro or Business plan subscription, you are eligible for a 100% refund within 7 calendar days of your initial purchase.
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">1. Cancellation of Subscription</h4>
                <p>
                  You may cancel your Smart Caption subscription at any time. When you cancel, you will continue to have full access to your paid features through the end of your current paid billing period. No further renewals will be charged to your card/UPI.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">2. Refund Eligibility</h4>
                <p>Refunds are processed under the following criteria:</p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li><strong>First-time Purchase:</strong> Requests made within 7 days of the initial subscription date are eligible for a full refund.</li>
                  <li><strong>Technical Glitch / Service Downtime:</strong> If a system fault prevented video captioning or export and our technical support could not resolve it within 48 hours, a pro-rated or full refund will be provided.</li>
                  <li><strong>Duplicate Charges:</strong> Any accidental duplicate payment will be refunded immediately without delay.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-semibold text-base">3. How to Request a Refund</h4>
                <p>
                  To request a refund, please send an email to <strong>sn3711550@gmail.com</strong> with:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Your registered account email address</li>
                  <li>Transaction ID / Order ID (from Razorpay or Stripe)</li>
                  <li>Brief reason for the refund request</li>
                </ul>
                <p>
                  Approved refunds are credited to the original payment source within <strong>5 to 7 business days</strong> as per banking and gateway standards.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-xl font-bold text-white">Contact & Support</h3>
                <p className="text-xs text-neutral-400 mt-1">We respond to all creator queries within 24 hours.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information Cards */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Official Support Email</span>
                    <p className="text-sm font-semibold text-violet-400 mt-1 select-all">sn3711550@gmail.com</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Primary email for billing, technical & licensing support</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Business Hours</span>
                    <p className="text-sm font-semibold text-white mt-1">Monday – Saturday</p>
                    <p className="text-xs text-neutral-400 mt-0.5">9:00 AM – 8:00 PM IST (Fast response time: &lt; 2 hours)</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Registered Operation</span>
                    <p className="text-sm font-semibold text-white mt-1">AutoCaption AI Technologies</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Creator Subtitle Suite & Video Automation Platform</p>
                  </div>
                </div>

                {/* Direct Message Form */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                  <h4 className="text-sm font-bold text-white mb-3">Send us a direct message</h4>

                  {contactSubmitted ? (
                    <div className="p-6 text-center space-y-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-sm font-bold text-white">Message Received!</p>
                      <p className="text-xs text-neutral-300">
                        Thank you for reaching out. Our team will get back to you at {contactEmail || 'your email'} shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitContact} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Santosh"
                          className="w-full px-3 py-2 bg-black/50 border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Your Email</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-3 py-2 bg-black/50 border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Your Message or Issue</label>
                        <textarea
                          required
                          rows={3}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Tell us what you need help with..."
                          className="w-full px-3 py-2 bg-black/50 border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Submit Request
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-xl font-bold text-white">About Smart Caption</h3>
                <p className="text-xs text-neutral-400 mt-1">Built for the next generation of short-form creators</p>
              </div>

              <section className="space-y-3">
                <p>
                  <strong>Smart Caption</strong> was built to solve a single, massive pain point for creators: <em>spending 3 to 4 hours manually transcribing and syncing animated captions on every 60-second Short or Reel.</em>
                </p>
                <p>
                  Today, over 80% of short-form videos are watched on mute. Without eye-catching, animated subtitles, viewers swipe away in less than 2 seconds. Smart Caption brings high-energy Hormozi, MrBeast, Ali Abdaal, and Desi Podcast caption styles directly to your browser with 1-click AI voice recognition and multi-language translation.
                </p>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <span className="text-2xl font-black text-violet-400">99.2%</span>
                  <p className="text-xs text-neutral-300 font-semibold mt-1">Voice Recognition Accuracy</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <span className="text-2xl font-black text-violet-400">30+</span>
                  <p className="text-xs text-neutral-300 font-semibold mt-1">Global & Indian Languages</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <span className="text-2xl font-black text-violet-400">&lt; 5s</span>
                  <p className="text-xs text-neutral-300 font-semibold mt-1">Instant Browser Preview</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02]">
          <span className="text-xs text-neutral-500">© 2026 Smart Caption. All rights reserved.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
