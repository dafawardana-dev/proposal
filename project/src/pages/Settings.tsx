import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { User, Lock, Bell, Shield, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

export const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Initialize state with user data (with fallbacks)
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Sync state with user data when it changes
  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileSubmitting(true);

    try {
      const nameParts = fullName.trim().split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      await apiRequest(`/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ first_name, last_name, email }),
      });

      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update failed:", error);
      alert(error.message || "Failed to update profile");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordSubmitting(true);

    try {
      await apiRequest(`/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          password: newPassword,
          current_password: currentPassword,
        }),
      });

      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update failed:", error);
      setPasswordError(error.message || "Failed to update password");
    } finally {
      setPasswordSubmitting(false);
    }
  };
  
  const userRole = user?.role?.name || 'N/A';
  const userDivision = user?.divisionName || 'N/A';
  const userId = user?.id || 'N/A';
  const userCreatedAt = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString() 
    : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Input 
                  label="Full Name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <Input 
                  label="Role" 
                  value={userRole} 
                  disabled 
                />
                <Input 
                  label="Division" 
                  value={userDivision} 
                  disabled 
                />
                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={profileSubmitting || !user}
                  >
                    {profileSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input 
                  label="Current Password" 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="Enter current password" 
                  required 
                />
                <Input 
                  label="New Password" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Enter new password" 
                  required 
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password" 
                  required 
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={passwordSubmitting || !user}
                  >
                    {passwordSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive email notifications for new archives
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Activity Alerts
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when someone edits your archives
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {theme === "light" ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Choose your preferred theme
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => theme !== "light" && toggleTheme()}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === "light"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Sun className="w-6 h-6 mx-auto mb-2 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Light
                      </p>
                    </button>
                    <button
                      onClick={() => theme !== "dark" && toggleTheme()}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === "dark"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Moon className="w-6 h-6 mx-auto mb-2 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Dark
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Account Info
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {userId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {userCreatedAt}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Access Level</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">
                    {userRole}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};