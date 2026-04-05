import { Stack, type StackProps } from "./Stack";
import { getAlignment } from "./getAlignment";
import { ClockAlignment } from "./types";

interface VStackProps extends StackProps {
  alignment?: ClockAlignment;
}

export const VStack = (props: VStackProps) => {
  const { children, alignment, style, ...rest } = props;

  const alignConfig = alignment ? getAlignment(alignment, "column") : {};

  return (
    <Stack
      style={[
        {
          ...alignConfig,
          flexDirection: "column",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Stack>
  );
};
