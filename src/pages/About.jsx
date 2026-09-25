import React from "react";
import {
  Code2,
  User,
  Rocket,
  Lightbulb,
  Github,
  ExternalLink,
} from "lucide-react";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full overflow-hidden from-flame-500/10 to-fbg-base-950 py-20 text-white"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* =========================
            SECTION HEADER
        ========================= */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-flame-500/30 bg-flame-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-flame-400 cursor-pointer ">
            <User size={16} />
            About Me
          </span>

          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Build Me &{" "}
            <span className="bg-gradient-to-r from-flame-400 to-flame-600 bg-clip-text text-transparent">
              {" "}
              My Stories
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-400 sm:text-lg">
            A little story about who I am, how I started coding, and what I have
            learned by building real projects.
          </p>
        </div>

        {/* =========================
            ABOUT CONTENT
        ========================= */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* LEFT */}
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12   border-flame-500/30 items-center justify-center rounded-xl bg-flame-500   text-flame-100 transition-colors group-hover:bg-flame-500 group-hover:text-whitehover:-translate-y-1 hover:border-flame-400 hover:shadow-glow">
                <Code2 size={28} />
              </div>

              <div>
                <h3 className="text-2xl font-bold">Hi, I'm Shivam</h3>

                <p className="text-sm text-[#ABD2FA]">
                  Developer • Learner • Builder
                </p>
              </div>
            </div>

            <p className="leading-7 text-gray-300">
              I am a Computer Science Engineering graduate who enjoys learning
              technology by building things. Instead of only learning concepts
              theoretically, I like turning ideas into real websites and
              applications.
            </p>

            <p className="mt-5 leading-7 text-gray-350">
              Most of the projects you see here were created during my project
              practice. Every project helped me understand something new — from
              designing interfaces and writing JavaScript to working with React,
              Node.js, APIs, databases and full-stack development.
            </p>

            <p className="mt-5 leading-7 text-gray-400">
              I believe that every project has a story. Some started as simple
              ideas, some came from curiosity, and some were created just to
              learn a new technology. Building them helped me improve my
              problem-solving skills and understand how real applications are
              developed.
            </p>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="rounded-3xl border-b border-base-700 bg-base-950/80 p-6 shadow-2xl backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#7692FF]">
                    My Journey
                  </p>

                  <h3 className="mt-1 text-2xl font-bold">
                    Learning by Building
                  </h3>
                </div>

                <Rocket size={30} className="text-[#ABD2FA]" />
              </div>

              {/* STORY 1 */}
              <Story
                icon={<Lightbulb size={20} />}
                title="The Idea"
                text="Every project starts with an idea. I try to turn simple ideas into useful and interactive web experiences."
              />

              {/* STORY 2 */}
              <Story
                icon={<Code2 size={20} />}
                title="The Practice"
                text="I build projects to practice what I learn and understand how different technologies work together."
              />

              {/* STORY 3 */}
              <Story
                icon={<Rocket size={20} />}
                title="The Experience"
                text="Each project gives me practical experience with UI, frontend development, backend APIs, databases and problem solving."
              />
            </div>
          </div>
        </div>

        {/* =========================
            PROJECT STORY
        ========================= */}
        {/* <div className="mt-16">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-widest text-[#7692FF]">
              My Stories
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              Projects I Built During My Practice
            </h3>

            <p className="mx-auto mt-3 max-w-2xl text-gray-400">
              These projects represent my learning journey and the technologies
              I explored while practicing development.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ProjectCard
              title="PDF Flow"
              description="A PDF utility project for working with PDF files, including splitting, extracting and other PDF operations."
              tech="React • JavaScript • Node.js"
            />

            <ProjectCard
              title="Real-Time Chat Application"
              description="A real-time chat application built to practice MERN development, authentication, messaging and real-time communication."
              tech="MERN • Socket.io • JWT"
            />

            <ProjectCard
              title="NEXORA"
              description="A social media project created to practice profiles, posts, messaging, notifications, media and real-time features."
              tech="MERN • React • Node.js"
            />
          </div>
        </div> */}

        {/* =========================
            FINAL MESSAGE
        ========================= */}
        <div className="mt-16 rounded-3xl border border-[#7692FF]/20 bg-[#111f52]/50 p-8 text-center">
          <Code2 size={32} className="mx-auto text-[#ABD2FA]" />

          <h3 className="mt-4 text-2xl font-bold">
            Every Project Tells a Story
          </h3>

          <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-400">
            I built these projects during my project practice to learn,
            experiment and improve. They are not just projects in my portfolio —
            they are part of my journey as a developer.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================
   STORY COMPONENT
========================================= */

function Story({ icon, title, text }) {
  return (
    <div className="relative mb-6 flex gap-4 last:mb-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B2CC1] text-[#ABD2FA]">
        {icon}
      </div>

      <div>
        <h4 className="font-semibold text-white">{title}</h4>

        <p className="mt-1 text-sm leading-6 text-gray-400">{text}</p>
      </div>
    </div>
  );
}

/* =========================================
   PROJECT CARD
========================================= */

function ProjectCard({ title, description, tech }) {
  return (
    <article className="group rounded-2xl border border-[#7692FF]/20 bg-[#111f52]/50 p-6 transition duration-300 hover:-translate-y-2 hover:border-[#7692FF]/50 hover:bg-[#111f52]">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2CC1] transition group-hover:scale-110">
        <Code2 size={21} />
      </div>

      <h4 className="text-xl font-bold">{title}</h4>

      <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>

      <div className="mt-5 inline-block rounded-lg bg-[#091540] px-3 py-2 text-xs text-[#ABD2FA]">
        {tech}
      </div>
    </article>
  );
}
