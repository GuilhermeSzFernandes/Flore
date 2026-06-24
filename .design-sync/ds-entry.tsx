// Flore design-system bundle entry.
// Re-exports the components synced to claude.ai/design (window.Flore.*).
// Sub-components (CardHeader, DialogTrigger, …) are exported for composition
// inside previews even though only the primary component gets its own card.
export { Button, buttonVariants } from "@/components/ui/button"
export { Input } from "@/components/ui/input"
export { Label } from "@/components/ui/label"
export { Textarea } from "@/components/ui/textarea"
export { Badge, badgeVariants } from "@/components/ui/badge"
export { Separator } from "@/components/ui/separator"
export {
  Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent,
} from "@/components/ui/card"
export {
  Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge,
} from "@/components/ui/avatar"
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "@/components/ui/tabs"
export {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogOverlay, DialogPortal, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
export {
  Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter,
  SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
export {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton,
  SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select"
export {
  Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
} from "@/components/ui/popover"
export {
  DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
export { Toaster } from "@/components/ui/sonner"
export { default as FloreLogo } from "@/components/FloreLogo"
export { default as PatientCombobox } from "@/components/PatientCombobox"
export { AppointmentStatusBadge } from "@/components/AppointmentStatusBadge"
export { RestrictionChip } from "@/components/RestrictionChip"
export { PlanLimitBanner } from "@/components/PlanLimitBanner"
