import React, { useState } from "react";
import emailjs from "@emailjs/browser"; // Import the emailjs library for sending emails

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSending(true);

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formData,
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        },
      );

      alert("Message sent successfully! Thank you for contacting me.");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("EMAILJS ERROR:", error);

      alert("Sorry! Your message could not be sent.\nPlease try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <article
      className="w-full min-h-screen bg-[#121212] text-white p-5 md:p-8 rounded-2xl"
      data-page="contact"
    >
      {/* ================================
          CONTACT HEADER
      ================================= */}

      <header className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Contact</h2>

        <div className="mt-2 h-1 w-10 rounded-full bg-orange-400" />
      </header>

      {/* ================================
          GOOGLE MAP
      ================================= */}

      <section
        className="
          relative
          w-full
          h-[220px]
          md:h-[280px]
          overflow-hidden
          rounded-2xl
          border
          border-[#383838]
          bg-[#202020]
          mb-8
        "
      >
        <iframe
          title="Meerut Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d111679.98246913313!2d77.6165579892823!3d28.98738724693256!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c64f457b66325%3A0x42faa83387a6be5e!2sMeerut%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1789581424327!5m2!1sen!2sin"
          className="
            w-full
            h-full
            border-0
            grayscale
            invert
          "
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </section>

      {/* ================================
          CONTACT FORM
      ================================= */}

      <section className="w-full">
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-6">
          Contact Form
        </h3>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Name */}

          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            required
            className="
              w-full
              rounded-xl
              border
              border-[#383838]
              bg-[#202020]
              px-5
              py-3.5
              text-sm
              text-white
              placeholder:text-gray-500
              outline-none
              transition-all
              duration-300
              focus:border-orange-400
              focus:ring-1
              focus:ring-orange-400/30
            "
          />

          {/* Email + Subject */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              className="
                w-full
                rounded-xl
                border
                border-[#383838]
                bg-[#202020]
                px-5
                py-3.5
                text-sm
                text-white
                placeholder:text-gray-500
                outline-none
                transition-all
                duration-300
                focus:border-orange-400
                focus:ring-1
                focus:ring-orange-400/30
              "
            />

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="
                w-full
                rounded-xl
                border
                border-[#383838]
                bg-[#202020]
                px-5
                py-3.5
                text-sm
                text-white
                placeholder:text-gray-500
                outline-none
                transition-all
                duration-300
                focus:border-orange-400
                focus:ring-1
                focus:ring-orange-400/30
              "
            />
          </div>

          {/* Message */}

          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            className="
              w-full
              min-h-[120px]
              max-h-[220px]
              resize-y
              rounded-xl
              border
              border-[#383838]
              bg-[#202020]
              px-5
              py-3.5
              text-sm
              text-white
              placeholder:text-gray-500
              outline-none
              transition-all
              duration-300
              focus:border-orange-400
              focus:ring-1
              focus:ring-orange-400/30
            "
          />

          {/* Submit Button */}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className={`
                group
                relative
                flex
                w-full
                md:w-auto
                min-w-[180px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[#383838]
                px-6
                py-3.5
                text-sm
                font-medium
                transition-all
                duration-300
                ${
                  sending
                    ? "cursor-not-allowed opacity-60 bg-[#202020] text-orange-400"
                    : "cursor-pointer bg-[#202020] text-orange-400 hover:border-orange-400 hover:bg-orange-400 hover:text-black hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-400/20"
                }
              `}
            >
              {/* Paper Plane Icon */}

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 2 11 13"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m22 2-7 20-4-9-9-4 20-7Z"
                />
              </svg>

              <span>{sending ? "Sending..." : "Send Message"}</span>
            </button>
          </div>
        </form>
      </section>
    </article>
  );
};

export default Contact;
