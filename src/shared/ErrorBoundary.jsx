import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "./ui.jsx";

// React error boundaries still require a class component — there's no
// hook equivalent as of React 19. Wraps the active tab so a bug in one
// module (a bad Recharts prop, a null-reference in a speculative feature
// like the AR concept preview) shows a contained fallback instead of
// white-screening the whole app.
export class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, resetKey: props.resetKey };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Resets when the active tab changes, so a crash in one tab doesn't
  // permanently lock the fallback in place for the rest of the session.
  // getDerivedStateFromProps (not componentDidUpdate + setState) is the
  // idiomatic way to sync state to a prop change without an extra render.
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    console.error("Tab crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-5" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF]">
              This section hit an unexpected error. Try switching tabs and coming back.
            </div>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
