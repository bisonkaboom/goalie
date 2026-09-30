/**
 * The first-of-the-month cows.
 *
 * Embedded from YouTube rather than vendored the way `SillyDuck` is, because
 * this is someone else's edit set to someone else's record — hosting a copy in
 * `public/` would be republishing both. The embed at least leaves the video on
 * its own channel, with its own view count. If Goalie is ever launched properly
 * this should become an original animation instead; see the note in the privacy
 * policy, which discloses the embed and has to stay true.
 *
 * `youtube-nocookie.com` is Google's privacy-enhanced player: it holds off on
 * cookies until the video is actually played. Nothing autoplays here, both
 * because browsers block sound-on autoplay anyway and because a video that
 * starts itself is exactly the thing `prefers-reduced-motion` exists to
 * prevent. Pressing play is the user's move.
 */

const VIDEO_ID = "HnDGQwlf8Co";

export default function FirstOfTheMonth() {
  return (
    <div className="text-center mb-4">
      <p className="first-of-month-banner mb-2">
        Wake up! It&rsquo;s the first of the month
      </p>

      {/* `loading="lazy"` matters more than usual: this sits above the score,
          so without it the day's chart would wait on a video player nobody has
          asked to watch yet. */}
      <div className="ratio ratio-9x16 first-of-month-frame mx-auto">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`}
          title="Dancing cows: it's the first of the month"
          allow="clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
