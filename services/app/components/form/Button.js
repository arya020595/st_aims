import { EllipsisLoading } from "../Loading";
import { motion, AnimatePresence } from "framer-motion";

export const Button = ({ loading, children, className, ...buttonProps }) => {
  return (
    <button className={`${className} relative`} {...buttonProps}>
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          shown: { opacity: 1 },
        }}
        initial="shown"
        animate={loading ? "hidden" : "shown"}
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            className="flex bg-white absolute top-0 left-0 right-0 bottom-0"
          ></motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center pt-1 absolute top-0 left-0 right-0 bottom-0"
          >
            <EllipsisLoading />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </button>
  );
};
