"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { slugify } from "@/lib/slug";
import { Icon, type IconName } from "./icons";
import { RsvpForm } from "./rsvp-form";

const slides = [
  ["/img/hero-bg.jpg", "Hiruni and Ravindu showing their wedding rings over white lilies", "/img/hero-1_sp.webp"],
  ["/img/hero-2.jpg", "Hiruni and Ravindu holding hands in the garden", "/img/hero-2_sp.webp"],
  ["/img/hero-3.webp", "Hiruni and Ravindu dancing beneath an archway", "/img/hero-3_sp.webp"],
] as const;

const timeline = [
  ["9:30 AM", "pin", "We Welcome You", "Welcome & seating"],
  ["9:50 AM", "heart", "We Marry", "Sacred vows on Poruwa"],
  ["10:25 AM", "glass", "We Raise a Toast", "Drinks & celebrations begin"],
  ["11:30 AM", "utensils", "We Dine", "Delightful wedding feast"],
  ["12:30 PM", "music", "We Dance", "Celebrate with music & joy"],
  ["01:15 PM", "sparkles", "We Celebrate", "The ceremonial gathering"],
  ["03:20 PM", "wave", "We Say Goodbye", "A beautiful send-off"],
] as const satisfies readonly (readonly [string, IconName, string, string])[];

const mapSrc = "https://www.google.com/maps?q=7.3027672,80.6367887&output=embed";
const mapUrl = "https://maps.app.goo.gl/ZJ6S4TzJ5DrnDfjH8";
const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Hiruni+%26+Ravindu+Wedding&dates=20261214T093000%2F20261214T153000&ctz=Asia%2FColombo&details=Wedding+celebration&location=The+Grand+Kandyan+Hotel%2C+Kandy%2C+Sri+Lanka";

export default function Home({ inviteeName, invitationSlug }: { inviteeName?: string; invitationSlug?: string }) {
  const hasValidInvitation = Boolean(invitationSlug && slugify(invitationSlug) === invitationSlug);
  const [opening, setOpening] = useState(false);
  const [finishingOpening, setFinishingOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationSeen, setInvitationSeen] = useState(false);
  const [showInvitationCue, setShowInvitationCue] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const openingVideo = useRef<HTMLVideoElement>(null);
  const envelopeSound = useRef<HTMLAudioElement>(null);
  const backgroundMusic = useRef<HTMLAudioElement>(null);
  const invitationButton = useRef<HTMLButtonElement>(null);
  const invitationCloseButton = useRef<HTMLButtonElement>(null);
  const invitationWasOpen = useRef(false);

  useEffect(() => {
    document.body.style.overflow = opened && !invitationOpen ? "" : "hidden";
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = ""; };
  }, [opened, invitationOpen]);

  useEffect(() => {
    if (!invitationOpen) {
      if (invitationWasOpen.current) invitationButton.current?.focus();
      invitationWasOpen.current = false;
      return;
    }
    invitationWasOpen.current = true;
    invitationCloseButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInvitationOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [invitationOpen]);

  useEffect(() => {
    if (!opened) return;
    const timer = window.setInterval(
      () => setActiveSlide((slide) => (slide + 1) % slides.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [opened]);

  useEffect(() => {
    if (!showInvitationCue) return;
    const timer = window.setTimeout(() => setShowInvitationCue(false), 3200);
    return () => window.clearTimeout(timer);
  }, [showInvitationCue]);

  const beginOpening = () => {
    setOpening(true);
    const envelope = envelopeSound.current;
    if (envelope) {
      envelope.volume = 0.12;
      envelope.play().catch(() => undefined);
    }
    const music = backgroundMusic.current;
    if (music) {
      music.volume = 0;
      music.play().catch(() => undefined);
    }
    const video = openingVideo.current;
    if (video) {
      video.playbackRate = 1.5;
      video.play().catch(finishOpening);
    }
  };

  const finishOpening = () => {
    openingVideo.current?.pause();
    if (envelopeSound.current) {
      envelopeSound.current.pause();
      envelopeSound.current.currentTime = 0;
    }
    const music = backgroundMusic.current;
    if (music) {
      music.currentTime = 0;
      music.volume = 0.3;
      music.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    }
    setOpened(true);
    if (!finishingOpening) setShowInvitationCue(true);
  };

  const cueOpeningFade = () => {
    const video = openingVideo.current;
    if (!video || finishingOpening || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (video.duration - video.currentTime <= 2.8) {
      video.playbackRate = 1;
      setFinishingOpening(true);
    }
  };

  const skipOpening = () => {
    setFinishingOpening(false);
    finishOpening();
  };

  const toggleMusic = () => {
    const music = backgroundMusic.current;
    if (!music) return;
    if (music.paused) music.play().then(() => setMusicPlaying(true)).catch(() => undefined);
    else {
      music.pause();
      setMusicPlaying(false);
    }
  };

  return (
    <main>
      <audio ref={envelopeSound} src="/img/envelope.mp3" preload="none" />
      <audio ref={backgroundMusic} src="/img/background.mp3" preload="none" loop />

      {!opened && (
        <div className={`opening-gate${finishingOpening ? " is-finishing" : ""}`}>
          <video ref={openingVideo} className="opening-video" muted playsInline preload="metadata" onTimeUpdate={cueOpeningFade} onEnded={finishOpening}>
            <source media="(max-width: 767px)" src="/img/portrait-champagne.mp4" type="video/mp4" />
            <source src="/img/landscape-champagne.mp4" type="video/mp4" />
          </video>
          {!opening ? (
            <button className="opening-trigger" type="button" onClick={beginOpening}>
              <span>Hiruni & Ravindu</span><small>Tap to open</small>
            </button>
          ) : (
            <button className="opening-skip" type="button" onClick={skipOpening}>Skip</button>
          )}
        </div>
      )}

      {opened && finishingOpening && (
        <div className="opening-wash-out" aria-hidden="true" onAnimationEnd={() => { setFinishingOpening(false); setShowInvitationCue(true); }} />
      )}

      {opened && (
        <>
          {hasValidInvitation && !invitationOpen && (
            <>
              {showInvitationCue && (
                <Image className="invitation-cue" src="/img/chalk_arrow.png" alt="" width={464} height={987} />
              )}
              <button ref={invitationButton} className={`invitation-toggle${invitationSeen ? " is-seen" : ""}`} type="button" onClick={() => { setShowInvitationCue(false); setInvitationSeen(true); setInvitationOpen(true); }} aria-label="Open wedding invitation">
                <Icon name="mail" />
              </button>
            </>
          )}
          <button className={`music-toggle${musicPlaying ? " is-playing" : ""}`} type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Pause music" : "Play music"}>
            <Icon name={musicPlaying ? "pause" : "music"} />
          </button>
        </>
      )}

      {hasValidInvitation && opened && invitationOpen && (
        <div className="invitation-backdrop" onClick={(event) => event.target === event.currentTarget && setInvitationOpen(false)}>
          <article className="invitation-card" role="dialog" aria-modal="true" aria-labelledby="invitation-title" aria-describedby="invitation-description">
            <button ref={invitationCloseButton} className="invitation-close" type="button" onClick={() => setInvitationOpen(false)} aria-label="Close wedding invitation"><Icon name="close" /></button>
            <div className="invitation-copy">
              <p className="invitation-kicker">Together with their families</p>
              <h2 id="invitation-title"><span>Hiruni</span><i>&amp;</i><span>Ravindu</span></h2>
              <p id="invitation-description" className="invitation-request">request the pleasure of the company of</p>
              <p className="invitee-name">{inviteeName ?? "Our Family & Friends"}</p>
              <p className="invitation-request">to celebrate their marriage</p>

              <div className="invitation-date" aria-label="Monday, December 14, 2026">
                <span>December</span><strong>14</strong><span>Monday<br />2026</span>
              </div>

              <p className="invitation-time">9:30 in the morning <span>until</span> 3:30 in the afternoon</p>
              <div className="invitation-venue">
                <small>At</small>
                <strong>The Grand Kandyan Hotel</strong>
                <span>Kandy, Sri Lanka</span>
              </div>
            </div>
          </article>
        </div>
      )}

      <section className="hero" id="home">
        <div className="hero-slider">
          {slides.map(([src, alt, mobileSrc], index) => (
            <div className="hero-slide-layer" style={{ opacity: activeSlide === index ? 1 : 0 }} key={src}>
              <picture className="hero-picture">
                {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
                <Image
                  className="hero-slide"
                  src={src}
                  alt={alt}
                  width={1920}
                  height={1080}
                  preload={index === 0}
                  sizes="100vw"
                  style={{ animation: activeSlide === index ? "hero-zoom 4s ease-out forwards" : "none", transform: activeSlide === index ? undefined : "scale(1)" }}
                />
              </picture>
            </div>
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="section-label on-dark">Save the date</p>
          <h1>Hiruni&<br />Ravindu</h1>
          <div className="hero-date"><span>December</span><strong>14</strong><span>2026</span></div>
          <a className="scroll-cue" href="#couple"><span>Scroll Down</span><Icon name="chevron-down" /></a>
        </div>
        <div className="slider-dots" aria-label="Wedding photos">
          {slides.map(([src], index) => (
            <button className={activeSlide === index ? "active" : ""} key={src} type="button" aria-label={`Go to slide ${index + 1}`} aria-current={activeSlide === index ? "true" : undefined} onClick={() => setActiveSlide(index)} />
          ))}
        </div>
      </section>

      <section className="couple-section page-section" id="couple">
        <div className="couple-grid">
          <article className="person-card">
            <Image src="/img/bride.jpg" alt="Hiruni — the bride" fill sizes="(max-width: 700px) 288px, 288px" />
            <div className="person-shade" />
            <div className="person-copy"><h2>Hiruni</h2><span>The Bride</span><p>With a heart full of love and gratitude, I can&apos;t wait to begin this beautiful journey with the one who makes every moment brighter.</p></div>
          </article>
          <article className="person-card">
            <Image src="/img/groom.jpg" alt="Ravindu — the groom" fill sizes="(max-width: 700px) 288px, 288px" />
            <div className="person-shade" />
            <div className="person-copy"><h2>Ravindu</h2><span>The Groom</span><p>Every love story is special, but ours is my favorite. I&apos;m blessed to share this journey with the most amazing person.</p></div>
          </article>
        </div>
        <div className="marriage-note">
          <div className="heart"><Icon name="heart" /></div>
          <p className="section-label">We are</p>
          <h2 className="section-title">Getting Married</h2>
          <p>From the moment our paths crossed, we knew that our love story was just beginning. Every day since has been a chapter filled with laughter, growth, and unforgettable memories. As we take the next step in our journey together, we invite you to share in the joy of this new chapter.</p>
          <em>— Ravindu & Hiruni —</em>
        </div>
      </section>

      <section className="location-section page-section" id="location">
        <div className="section-heading"><p className="section-label">Join us at</p><h2 className="section-title">Location</h2></div>
        <div className="location-card">
          <div className="location-pin"><Icon name="pin" /></div>
          <h3>The Grand Kandyan Hotel</h3>
          <p>Kandy</p>
          <span className="time-chip"><Icon name="clock" />09:30 AM to 3:30 PM</span>
          <div className="map-frame"><iframe src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Wedding venue location" /></div>
          <div className="location-actions">
            <a className="primary-button" href={mapUrl} target="_blank" rel="noreferrer"><Icon name="pin" />Open in maps<Icon name="external-link" /></a>
            <a className="secondary-button" href={calendarUrl} target="_blank" rel="noreferrer"><Icon name="calendar" />Add to calendar<Icon name="arrow-down" /></a>
          </div>
        </div>
      </section>

      <section className="timeline-section page-section">
        <div className="section-heading"><p className="section-label">Our celebration</p><h2 className="section-title">Timeline</h2></div>
        <div className="timeline-scroll">
          <ol>
            {timeline.map(([time, icon, title, description]) => (
              <li key={time}><time>{time}</time><span className="timeline-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{description}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rsvp-section page-section" id="rsvp">
        <div className="rsvp-wrap">
          <p className="section-label">Be Our Guest</p>
          <h2 className="section-title">RSVP</h2>
          <p className="rsvp-deadline">Kindly respond by October 20, 2026</p>
          <RsvpForm defaultName={inviteeName} invitationSlug={invitationSlug} />
          <p className="rsvp-contact-note">For any changes, please contact the couple directly using the phone numbers below.</p>
        </div>
      </section>

      <footer><h3>Hiruni & Ravindu</h3><p>December 14 2026</p><p>Hiruni: 0715129071 &nbsp;|&nbsp; Ravindu: 0715328308</p><small>© 2026 ravinduranathilaka | All rights reserved</small></footer>
    </main>
  );
}
