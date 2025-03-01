import { supabase } from "./supabase";


export const signupAdmin = async (email: string, password: string, name: string, schoolName: string, schoolAddress: string) => {
    const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        console.error("Sign-up error:", authError.message);
        return { success: false, error: authError.message };
    }

    const userId = authUser.user?.id;

    if (!userId) {
        return { success: false, error: "User ID not found after sign-up." };
    }

    // Create school and link to admin
    const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert([{ name: schoolName, address: schoolAddress, admin_id: userId }])
        .select()
        .single();

    if (schoolError) {
        console.error("School creation error:", schoolError.message);
        return { success: false, error: schoolError.message };
    }

    // Update admin user to belong to the school
    const { error: updateError } = await supabase
        .from("users")
        .update({ name, role: "admin", school_id: school.id })
        .eq("id", userId);

    if (updateError) {
        console.error("User update error:", updateError.message);
        return { success: false, error: updateError.message };
    }

    return { success: true, message: "Admin and school created successfully!" };
};
