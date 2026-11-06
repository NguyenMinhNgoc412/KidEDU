import { fireEvent, render } from "@testing-library/react-native";
import { ChildGenderField } from "../ChildGenderField";

describe("explicit parent gender input", () => {
  it("starts unselected, announces selection and uses an explicit action", async () => {
    const onChange = jest.fn();
    const screen = await render(<ChildGenderField value={null} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Bé trai" }).props.accessibilityState).toMatchObject({
      selected: false
    });
    expect(screen.getByRole("button", { name: "Bé gái" }).props.accessibilityState).toMatchObject({
      selected: false
    });
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Bé gái" }));
    expect(onChange).toHaveBeenCalledWith("girl");
    await screen.rerender(<ChildGenderField value="girl" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Bé gái" }).props.accessibilityState).toMatchObject({
      selected: true
    });
    expect(screen.getByText("✓ Bé gái")).toBeTruthy();
  });
  it("does not accept changes during save", async () => {
    const onChange = jest.fn();
    const screen = await render(<ChildGenderField value={null} onChange={onChange} disabled />);
    await fireEvent.press(screen.getByRole("button", { name: "Bé trai" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Bé trai" })).toBeDisabled();
  });
});
