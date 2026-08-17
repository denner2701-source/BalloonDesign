import { createClient } from "@supabase/supabase-js";
import * as THREE from "three";

window.supabase = { createClient };
window.THREE = THREE;
