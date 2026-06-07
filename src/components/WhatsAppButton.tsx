import { motion } from "framer-motion";

export function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/96598808547"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all hover:bg-[#20ba5a] hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] md:bottom-8 md:right-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Pulse effect */}
      <span className="absolute -inset-1.5 -z-10 animate-ping rounded-full bg-[#25D366]/40 opacity-75 duration-1000" />
      
      {/* WhatsApp SVG Icon */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.626 0 10.205-4.579 10.209-10.207.002-2.728-1.059-5.293-2.99-7.224C17.344 1.252 14.782.19 12.007.19h-.006c-5.625 0-10.206 4.579-10.21 10.208-.001 1.96.512 3.878 1.49 5.608l-.98 3.57 3.655-.959zm13.385-5.32c-.3-.15-1.771-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.777.975-.951 1.174-.176.2-.351.224-.652.074-1.8-.9-3.05-1.58-4.25-3.64-.19-.33.19-.307.54-.99.09-.18.04-.34-.02-.49-.06-.15-.48-1.15-.66-1.585-.17-.42-.35-.36-.48-.36-.12 0-.27 0-.42 0-.15 0-.38.05-.58.27-.2.22-.75.73-.75 1.78s.77 2.07.88 2.22c.11.15 1.5 2.29 3.64 3.22.51.22.9.36 1.2.46.51.16.98.14 1.35.08.41-.06 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.19-.58-.34z" />
      </svg>
    </motion.a>
  );
}
