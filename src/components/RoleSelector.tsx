
import { useState } from "react";
import { Check, Plus, UserRound } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface Role {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

const DEFAULT_ROLES: Role[] = [
  {
    id: "default",
    name: "Assistant",
    description: "A helpful, harmless, and honest AI assistant that provides information and assistance."
  },
  {
    id: "coder",
    name: "Code Assistant",
    description: "An AI specialized in helping with programming tasks, debugging, and software development."
  },
  {
    id: "tutor",
    name: "Learning Tutor",
    description: "An AI focused on education, explaining concepts clearly and helping users learn new topics."
  },
  {
    id: "creative",
    name: "Creative Writer",
    description: "An AI focused on creative writing, storytelling, and generating imaginative content."
  }
];

interface RoleSelectorProps {
  onRoleSelect: (role: Role) => void;
  activeRole: Role | null;
}

const RoleSelector = ({ onRoleSelect, activeRole }: RoleSelectorProps) => {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  
  const handleAddCustomRole = () => {
    if (customRoleName.trim() && customRoleDescription.trim()) {
      const newRole: Role = {
        id: `custom-${Date.now()}`,
        name: customRoleName.trim(),
        description: customRoleDescription.trim(),
        isCustom: true
      };
      
      setRoles([...roles, newRole]);
      setCustomRoleName("");
      setCustomRoleDescription("");
      onRoleSelect(newRole);
    }
  };

  return (
    <div className="relative z-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300"
          >
            <UserRound className="h-4 w-4" />
            <span className="font-medium">{activeRole?.name || "Default"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">Select a role</h3>
              <Select 
                value={activeRole?.id} 
                onValueChange={(value) => {
                  const selectedRole = roles.find(r => r.id === value);
                  if (selectedRole) onRoleSelect(selectedRole);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center">
                        <span>{role.name}</span>
                        {role.isCustom && (
                          <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">Custom</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {activeRole && (
                <div className="mt-2 text-sm text-gray-600">{activeRole.description}</div>
              )}
            </div>
            
            <div className="border-t pt-3">
              <h3 className="font-medium text-sm mb-2">Create custom role</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Role name"
                  value={customRoleName}
                  onChange={(e) => setCustomRoleName(e.target.value)}
                />
                <Textarea
                  placeholder="Role description and instructions"
                  className="min-h-[80px]"
                  value={customRoleDescription}
                  onChange={(e) => setCustomRoleDescription(e.target.value)}
                />
                <Button 
                  className="w-full" 
                  onClick={handleAddCustomRole}
                  disabled={!customRoleName.trim() || !customRoleDescription.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Role
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default RoleSelector;
