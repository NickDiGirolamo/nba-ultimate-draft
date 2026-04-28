import clsx from "clsx";

export type CardHoloVariant =
  | "prism"
  | "frame"
  | "flash"
  | "frame-soft"
  | "frame-vivid"
  | "frame-spectrum";

interface CardHoloOverlayProps {
  enabled?: boolean;
  className?: string;
  variant?: CardHoloVariant;
}

export const CardHoloOverlay = ({
  enabled = false,
  className,
  variant = "prism",
}: CardHoloOverlayProps) => {
  if (!enabled) {
    return null;
  }

  const renderVariant = () => {
    switch (variant) {
      case "frame":
        return (
          <>
            <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay bg-[url('https://img.freepik.com/free-vector/abstract-hologram-gradient-background_1048-10069.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 opacity-[0.42] mix-blend-soft-light bg-[radial-gradient(circle_at_10%_12%,rgba(255,0,170,1),transparent_18%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,1),transparent_18%),radial-gradient(circle_at_10%_88%,rgba(250,204,21,0.92),transparent_20%),radial-gradient(circle_at_88%_88%,rgba(45,212,191,0.96),transparent_18%),radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.42),transparent_16%),radial-gradient(circle_at_50%_94%,rgba(196,181,253,0.56),transparent_18%)]" />
            <div className="absolute inset-0 opacity-[0.64] mix-blend-color-dodge bg-[linear-gradient(118deg,transparent_0%,rgba(255,255,255,0.12)_14%,rgba(255,0,170,0.28)_22%,transparent_30%,rgba(56,189,248,0.24)_46%,transparent_56%,rgba(45,212,191,0.22)_72%,rgba(250,204,21,0.24)_82%,transparent_100%)]" />
            <div className="absolute inset-[18px] rounded-[inherit] bg-[radial-gradient(circle_at_center,transparent_0%,transparent_58%,rgba(7,12,22,0.1)_74%,rgba(7,12,22,0.22)_100%)]" />
            <div className="absolute inset-0 opacity-[0.54] mix-blend-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,1),transparent_11%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.92),transparent_9%),radial-gradient(circle_at_28%_72%,rgba(255,255,255,0.82),transparent_10%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.76),transparent_9%)]" />
          </>
        );
      case "frame-soft":
        return (
          <>
            <div className="absolute inset-0 opacity-[0.14] mix-blend-overlay bg-[url('https://img.freepik.com/free-vector/abstract-hologram-gradient-background_1048-10069.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 opacity-[0.34] mix-blend-soft-light bg-[radial-gradient(circle_at_10%_12%,rgba(255,0,170,0.92),transparent_16%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.92),transparent_16%),radial-gradient(circle_at_12%_88%,rgba(250,204,21,0.84),transparent_18%),radial-gradient(circle_at_88%_86%,rgba(45,212,191,0.9),transparent_16%),radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.3),transparent_14%)]" />
            <div className="absolute inset-0 opacity-[0.5] mix-blend-color-dodge bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.1)_14%,rgba(255,0,170,0.22)_22%,transparent_30%,rgba(56,189,248,0.2)_46%,transparent_56%,rgba(45,212,191,0.18)_72%,rgba(250,204,21,0.2)_82%,transparent_100%)]" />
            <div className="absolute inset-0 opacity-[0.72] mix-blend-screen bg-[linear-gradient(135deg,rgba(255,0,170,0.34)_0%,rgba(255,255,255,0.06)_14%,transparent_26%,transparent_72%,rgba(45,212,191,0.26)_86%,rgba(250,204,21,0.3)_100%)]" />
            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.16),inset_0_0_0_5px_rgba(255,0,170,0.09),inset_0_0_34px_rgba(56,189,248,0.16),inset_0_0_56px_rgba(250,204,21,0.08)]" />
            <div className="absolute inset-[2px] rounded-[inherit] opacity-[0.9] bg-[linear-gradient(135deg,rgba(255,0,170,0.22)_0%,transparent_18%,transparent_72%,rgba(45,212,191,0.18)_86%,rgba(250,204,21,0.22)_100%)]" />
            <div className="absolute inset-[22px] rounded-[inherit] bg-[radial-gradient(circle_at_center,transparent_0%,transparent_61%,rgba(7,12,22,0.08)_76%,rgba(7,12,22,0.18)_100%)]" />
            <div className="absolute inset-0 opacity-[0.42] mix-blend-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.94),transparent_10%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.82),transparent_8%),radial-gradient(circle_at_28%_72%,rgba(255,255,255,0.74),transparent_9%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.68),transparent_8%)]" />
          </>
        );
      case "frame-vivid":
        return (
          <>
            <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay bg-[url('https://img.freepik.com/free-vector/abstract-hologram-gradient-background_1048-10069.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 opacity-[0.48] mix-blend-soft-light bg-[radial-gradient(circle_at_8%_10%,rgba(255,0,170,1),transparent_18%),radial-gradient(circle_at_90%_12%,rgba(56,189,248,1),transparent_18%),radial-gradient(circle_at_10%_90%,rgba(250,204,21,0.96),transparent_20%),radial-gradient(circle_at_88%_88%,rgba(45,212,191,1),transparent_18%),radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.46),transparent_16%),radial-gradient(circle_at_52%_94%,rgba(196,181,253,0.62),transparent_18%)]" />
            <div className="absolute inset-0 opacity-[0.72] mix-blend-color-dodge bg-[linear-gradient(116deg,transparent_0%,rgba(255,255,255,0.14)_12%,rgba(255,0,170,0.34)_20%,transparent_28%,rgba(56,189,248,0.28)_44%,transparent_54%,rgba(45,212,191,0.26)_70%,rgba(250,204,21,0.28)_82%,transparent_100%)]" />
            <div className="absolute inset-[16px] rounded-[inherit] bg-[radial-gradient(circle_at_center,transparent_0%,transparent_56%,rgba(7,12,22,0.12)_72%,rgba(7,12,22,0.26)_100%)]" />
            <div className="absolute inset-0 opacity-[0.6] mix-blend-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,1),transparent_11%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.96),transparent_9%),radial-gradient(circle_at_28%_72%,rgba(255,255,255,0.86),transparent_10%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.8),transparent_9%)]" />
          </>
        );
      case "frame-spectrum":
        return (
          <>
            <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay bg-[url('https://img.freepik.com/free-vector/abstract-hologram-gradient-background_1048-10069.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 opacity-[0.44] mix-blend-soft-light bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,0,170,0.9),rgba(56,189,248,0.9),rgba(45,212,191,0.86),rgba(250,204,21,0.84),rgba(196,181,253,0.9),rgba(255,0,170,0.9))]" />
            <div className="absolute inset-0 opacity-[0.38] mix-blend-color-dodge bg-[radial-gradient(circle_at_50%_50%,transparent_0%,transparent_52%,rgba(255,255,255,0.12)_68%,rgba(255,255,255,0.34)_84%,rgba(255,255,255,0.14)_100%)]" />
            <div className="absolute inset-[20px] rounded-[inherit] bg-[radial-gradient(circle_at_center,transparent_0%,transparent_60%,rgba(7,12,22,0.08)_76%,rgba(7,12,22,0.18)_100%)]" />
            <div className="absolute inset-0 opacity-[0.48] mix-blend-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.94),transparent_11%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.86),transparent_9%),radial-gradient(circle_at_28%_72%,rgba(255,255,255,0.76),transparent_10%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.7),transparent_9%)]" />
          </>
        );
      case "flash":
        return (
          <>
            <div className="absolute inset-0 opacity-[0.28] mix-blend-overlay bg-[url('https://img.freepik.com/free-vector/abstract-hologram-gradient-background_1048-10069.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 opacity-[0.48] mix-blend-soft-light bg-[radial-gradient(circle_at_16%_20%,rgba(255,0,170,1),transparent_18%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,1),transparent_18%),radial-gradient(circle_at_24%_84%,rgba(250,204,21,0.94),transparent_20%),radial-gradient(circle_at_82%_82%,rgba(45,212,191,0.98),transparent_18%),radial-gradient(circle_at_50%_10%,rgba(196,181,253,0.62),transparent_18%)]" />
            <div className="absolute inset-0 opacity-[0.78] mix-blend-color-dodge bg-[linear-gradient(112deg,transparent_0%,rgba(255,255,255,0.14)_10%,rgba(255,0,170,0.36)_16%,transparent_24%,rgba(255,255,255,0.34)_32%,rgba(56,189,248,0.38)_38%,transparent_46%,rgba(45,212,191,0.36)_56%,rgba(250,204,21,0.36)_64%,transparent_74%,rgba(192,132,252,0.36)_86%,transparent_100%)]" />
            <div className="absolute inset-0 opacity-[0.3] mix-blend-color-dodge bg-[linear-gradient(130deg,transparent_0%,transparent_28%,rgba(255,255,255,0.18)_34%,rgba(255,255,255,0.76)_38%,rgba(255,255,255,0.22)_42%,transparent_48%,transparent_100%)]" />
            <div className="absolute inset-0 opacity-[0.58] mix-blend-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,1),transparent_11%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.9),transparent_9%),radial-gradient(circle_at_28%_72%,rgba(255,255,255,0.8),transparent_10%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.76),transparent_9%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_32%,rgba(255,255,255,0.02)_56%,rgba(255,255,255,0.08)_100%)]" />
          </>
        );
      case "prism":
      default:
        return (
          <>
            <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay bg-[url('https://img.freepik.com/free-vector/abstract-hologram-gradient-background_1048-10069.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 opacity-[0.36] mix-blend-soft-light bg-[radial-gradient(circle_at_14%_16%,rgba(255,0,170,0.95),transparent_16%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.95),transparent_16%),radial-gradient(circle_at_18%_84%,rgba(250,204,21,0.88),transparent_18%),radial-gradient(circle_at_86%_82%,rgba(45,212,191,0.92),transparent_16%),radial-gradient(circle_at_50%_10%,rgba(196,181,253,0.54),transparent_18%),radial-gradient(circle_at_50%_92%,rgba(244,114,182,0.46),transparent_18%)]" />
            <div className="absolute inset-0 opacity-[0.68] mix-blend-color-dodge bg-[linear-gradient(112deg,transparent_0%,rgba(255,255,255,0.12)_10%,rgba(255,0,170,0.34)_16%,transparent_24%,rgba(255,255,255,0.32)_32%,rgba(56,189,248,0.36)_38%,transparent_46%,rgba(45,212,191,0.34)_56%,rgba(250,204,21,0.34)_64%,transparent_74%,rgba(192,132,252,0.34)_86%,transparent_100%)]" />
            <div className="absolute inset-0 opacity-[0.56] mix-blend-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,1),transparent_11%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.9),transparent_9%),radial-gradient(circle_at_28%_72%,rgba(255,255,255,0.8),transparent_10%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.74),transparent_9%)]" />
            <div className="absolute inset-0 opacity-[0.2] mix-blend-color-dodge bg-[linear-gradient(128deg,transparent_0%,transparent_31%,rgba(255,255,255,0.16)_36%,rgba(255,255,255,0.64)_39%,rgba(255,255,255,0.18)_42%,transparent_48%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_30%,rgba(255,255,255,0.02)_52%,rgba(255,255,255,0.12)_100%)]" />
            <div className="absolute inset-[10px] rounded-[inherit] bg-[radial-gradient(circle_at_center,transparent_0%,transparent_46%,rgba(5,10,20,0.06)_66%,rgba(5,10,20,0.16)_100%)]" />
          </>
        );
    }
  };

  return (
    <div
      className={clsx(
        "pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]",
        className,
      )}
      aria-hidden="true"
    >
      {renderVariant()}
    </div>
  );
};
