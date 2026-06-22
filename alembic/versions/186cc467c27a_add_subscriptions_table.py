"""add subscriptions table
Revision ID: 186cc467c27a
Revises: 6abde7c21add
Create Date: 2026-06-22 13:32:07.287487
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '186cc467c27a'
down_revision: Union[str, Sequence[str], None] = '6abde7c21add'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=True),
        sa.Column('last_payment_date', sa.DateTime(), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_id')
    )

def downgrade() -> None:
    op.drop_table('subscriptions')
