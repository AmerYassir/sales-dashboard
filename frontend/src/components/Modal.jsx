import { FaXmark } from "react-icons/fa6";

const Modal = ({ title, isModalOpen, onClose, children }) => {
  if (isModalOpen !== true) {
    return null;
  }
  return (
    <section className="fixed left-0 top-0 right-0 bottom-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <article className="sm:mx-auto w-7/8 sm:max-w-2/3 lg:max-w-1/3 p-6 rounded-lg shadow-2xl bg-neutral-800">
        <div className="flex flex-col justify-between items-start w-full h-full">
          <div className="w-full flex justify-between items-center">
            <p className="font-extrabold text-3xl">{title}</p>
            <button type="button" onClick={onClose}>
              <FaXmark />
            </button>
          </div>
          <hr className="w-full my-3" style={{ color: "var(--text-primary)", opacity: 0.5 }} />
          {children}
        </div>
      </article>
    </section>
  );
};

export default Modal;
