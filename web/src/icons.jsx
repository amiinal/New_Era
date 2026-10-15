import React from 'react';
import {
  ArrowLeftRight, ChartColumn, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Ellipsis, Inbox, LogOut, Menu, MessageCircle, PanelLeft,
  Power, Search, Send, Settings, Shield, Store, User, X,
} from 'lucide-react';

// One icon family across web + app (lucide here, lucide-react-native
// there). Same { size, color } prop shape the hand-rolled set used.
function wrap(Icon) {
  return (props) => {
    const { size = 20, color = 'currentColor' } = props || {};
    return <Icon size={size} color={color} style={{ flexShrink: 0 }} />;
  };
}

export const MenuIcon = wrap(Menu);
export const PanelLeftIcon = wrap(PanelLeft);
export const ChevronDownIcon = wrap(ChevronDown);
export const ChevronLeftIcon = wrap(ChevronLeft);
export const ChevronRightIcon = wrap(ChevronRight);
export const XIcon = wrap(X);
export const UserIcon = wrap(User);
export const SettingsIcon = wrap(Settings);
export const HelpIcon = wrap(CircleHelp);
export const ChatIcon = wrap(MessageCircle);
export const SwitchIcon = wrap(ArrowLeftRight);
export const LogoutIcon = wrap(LogOut);
export const ShieldIcon = wrap(Shield);
export const StoreIcon = wrap(Store);
export const ChartIcon = wrap(ChartColumn);
export const PowerIcon = wrap(Power);
export const InboxIcon = wrap(Inbox);
export const SearchIcon = wrap(Search);
export const DotsIcon = wrap(Ellipsis);
export const SendIcon = wrap(Send);
