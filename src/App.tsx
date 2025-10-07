import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Components</h1>
        <div className="space-y-4">
          <Input placeholder="Test input..." />
          <Button>Click me</Button>
        </div>
      </Card>
    </div>
  )
}

export default App