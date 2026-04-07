import { Stack, type StackProps } from "./Stack";
import { getAlignment } from "./getAlignment";
import { ClockAlignment } from "./types";

interface HStackProps extends StackProps {
  alignment?: ClockAlignment;
}

export const HStack = (props: HStackProps) => {
  const { children, alignment, style, ...rest } = props;

  const alignConfig = alignment ? getAlignment(alignment, "row") : {};

  return (
    <Stack
      style={[
        {
          ...alignConfig,
          flexDirection: "row",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Stack>
  );
};
