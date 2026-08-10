export default function DemoVideoPlayer() {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.12)] relative bg-black"
      style={{ paddingBottom: '56.25%' }}
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        controls
        playsInline
        preload="metadata"
        src="https://frzymmgjyevojizjiakb.supabase.co/storage/v1/object/public/videos/kura-demo.mp4"
      />
    </div>
  )
}
