export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          available_hours_per_week: number | null;
          energy_level: "low" | "medium" | "high" | null;
          capacity_notes: string | null;
          constraints: string[];
          standard_accepted_at: string | null;
          zero_state_completed_at: string | null;
          clarifying_completed_at: string | null;
          zero_state: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          available_hours_per_week?: number | null;
          energy_level?: "low" | "medium" | "high" | null;
          capacity_notes?: string | null;
          constraints?: string[];
          standard_accepted_at?: string | null;
          zero_state_completed_at?: string | null;
          clarifying_completed_at?: string | null;
          zero_state?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      responsibilities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_non_negotiable: boolean;
          time_demand: "low" | "medium" | "high";
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          is_non_negotiable?: boolean;
          time_demand: "low" | "medium" | "high";
        };
        Update: Partial<Database["public"]["Tables"]["responsibilities"]["Insert"]>;
        Relationships: [];
      };
      competing_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          priority: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          priority: number;
        };
        Update: Partial<Database["public"]["Tables"]["competing_goals"]["Insert"]>;
        Relationships: [];
      };
      visions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          media_urls: string[];
          living_density: number;
          status: "draft" | "active" | "locked" | "completed" | "archived";
          context_snapshot: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          media_urls?: string[];
          living_density?: number;
          status: "draft" | "active" | "locked" | "completed" | "archived";
          context_snapshot: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["visions"]["Insert"]>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          vision_id: string;
          phases: string[];
          route: "necessary" | "compressed" | "direct_proof" | null;
          is_locked: boolean;
          locked_at: string | null;
          capitalization_locked: boolean;
          capitalization_locked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vision_id: string;
          phases?: string[];
          route?: "necessary" | "compressed" | "direct_proof" | null;
          is_locked?: boolean;
          locked_at?: string | null;
          capitalization_locked?: boolean;
          capitalization_locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      plan_actions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          title: string;
          description: string;
          phase: string;
          sort_order: number;
          status: "pending" | "in_progress" | "completed" | "skipped";
          dependencies: string[];
          estimated_effort: "low" | "medium" | "high";
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          title: string;
          description: string;
          phase: string;
          sort_order: number;
          status: "pending" | "in_progress" | "completed" | "skipped";
          dependencies?: string[];
          estimated_effort: "low" | "medium" | "high";
        };
        Update: Partial<Database["public"]["Tables"]["plan_actions"]["Insert"]>;
        Relationships: [];
      };
      evidence_records: {
        Row: {
          id: string;
          user_id: string;
          action_id: string;
          vision_id: string;
          payload_type: "text" | "image" | "link" | "file";
          payload_content: string;
          result_note: string;
          quality_grade: "weak" | "standard" | "strong";
          evidence_ref: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_id: string;
          vision_id: string;
          payload_type: "text" | "image" | "link" | "file";
          payload_content: string;
          result_note?: string;
          quality_grade?: "weak" | "standard" | "strong";
          evidence_ref?: string;
          recorded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evidence_records"]["Insert"]>;
        Relationships: [];
      };
      possibility_turning_points: {
        Row: {
          id: string;
          user_id: string;
          vision_id: string;
          triggering_evidence_ids: string[];
          declaration: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vision_id: string;
          triggering_evidence_ids?: string[];
          declaration: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["possibility_turning_points"]["Insert"]>;
        Relationships: [];
      };
      life_portfolio_entries: {
        Row: {
          id: string;
          user_id: string;
          vision_id: string;
          type: "vision" | "action" | "evidence" | "turning_point" | "connection";
          reference_id: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vision_id: string;
          type: "vision" | "action" | "evidence" | "turning_point" | "connection";
          reference_id: string;
          recorded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["life_portfolio_entries"]["Insert"]>;
        Relationships: [];
      };
      strategic_roles: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          vision_id: string;
          kind: "decision_maker" | "practitioner" | "collaborator" | "introducer";
          title: string;
          reason: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          vision_id: string;
          kind: "decision_maker" | "practitioner" | "collaborator" | "introducer";
          title: string;
          reason: string;
          sort_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["strategic_roles"]["Insert"]>;
        Relationships: [];
      };
      strategic_connections: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          plan_id: string;
          vision_id: string;
          action_id: string | null;
          name: string;
          context: string;
          channel: string;
          draft: string;
          stage: "nominated" | "contact_drafted" | "contact_sent" | "reply_received" | "meeting_held" | "request_made";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          plan_id: string;
          vision_id: string;
          action_id?: string | null;
          name: string;
          context: string;
          channel?: string;
          draft?: string;
          stage: "nominated" | "contact_drafted" | "contact_sent" | "reply_received" | "meeting_held" | "request_made";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["strategic_connections"]["Insert"]>;
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: "free" | "pro";
          status: "free" | "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid" | "paused";
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          price_id: string | null;
          product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: "free" | "pro";
          status?: "free" | "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid" | "paused";
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          price_id?: string | null;
          product_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_subscriptions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
