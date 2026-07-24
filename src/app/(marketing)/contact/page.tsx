import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Exam Hub team for support, demos or partnership enquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Contact us
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Questions, feedback or want a demo for your institute? Send us a
            message and we&apos;ll get back to you.
          </p>

          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="font-semibold text-gray-900">Email</dt>
              <dd className="mt-1 text-gray-600">alaykumarmukherjee@gmail.com</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Phone</dt>
              <dd className="mt-1 text-gray-600">+91 00000 00000</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Address</dt>
              <dd className="mt-1 text-gray-600">
                Exam Hub EdTech Pvt. Ltd.
                <br />
                Bengaluru, India
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
